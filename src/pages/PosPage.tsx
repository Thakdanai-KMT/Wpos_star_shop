import { useState, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getPromptPayPayload } from '../lib/promptpay'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useCustomers } from '../hooks/useCustomers'
import { useCustomerBalances } from '../hooks/useCustomerBalances'
import { useAuth } from '../contexts/AuthContext'
import { canUseCredit } from '../lib/roles'
import { addDaysThai, todayInThailand } from '../lib/thai-date'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Input, Select, Textarea } from '../components/ui/Input'
import type {
  CartItem,
  PaymentMethod,
  CreateSaleInput,
} from '../types/sale'

import { apiClient, ApiError } from '../lib/api-client'

export default function PosPage() {
  // =========================================================
  // Data
  // =========================================================

  const { products, isLoading, error, refetch } = useProducts()
  const { categories } = useCategories()
  const { user } = useAuth()
  const creditAllowed = canUseCredit(user?.role)
  const { customers } = useCustomers('')
  const {
    balances,
    error: balancesError,
    refresh: refreshBalances,
  } = useCustomerBalances(creditAllowed)

  // =========================================================
  // State
  // =========================================================

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )

  const [cart, setCart] = useState<CartItem[]>([])

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('CASH')

  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [creditNote, setCreditNote] = useState('')

  const [isSelling, setIsSelling] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)
  const [sellSuccess, setSellSuccess] = useState<string | null>(null)

  // =========================================================
  // Filter Products
  // =========================================================

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesCategory =
      !selectedCategoryId ||
      product.category_id === selectedCategoryId

    return product.is_active && matchesSearch && matchesCategory
  })

  // =========================================================
  // Cart Calculations
  // =========================================================

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  )

  const cartTotalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  // =========================================================
  // Credit (ขายเชื่อ)
  // =========================================================

  const isCredit = paymentMethod === 'CREDIT'
  const selectedCustomer = customers.find((c) => c.id === customerId)
  const balanceRow = balances.find((b) => b.customer_id === customerId)
  const outstanding = balanceRow?.balance ?? 0
  const overdueAmount = balanceRow?.overdue_amount ?? 0
  const creditLimit = selectedCustomer?.credit_limit ?? null
  const afterBill = outstanding + cartTotal
  const overLimit = creditLimit !== null && afterBill > creditLimit

  // =========================================================
  // Add Product To Cart
  // =========================================================

  function addToCart(productId: string) {
    const product = products.find(
      (item) => item.id === productId,
    )

    if (!product) {
      return
    }

    if (product.stock_quantity <= 0) {
      return
    }

    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => item.product_id === productId,
      )

      if (existingItem) {
        if (
          existingItem.quantity >=
          product.stock_quantity
        ) {
          return previousCart
        }

        return previousCart.map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        )
      }

      return [
        ...previousCart,
        {
          product_id: product.id,
          product_name: product.product_name,
          unit_price: product.unit_price,
          quantity: 1,
        },
      ]
    })
  }

  // =========================================================
  // Update Quantity
  // =========================================================

  function updateQuantity(
    productId: string,
    delta: number,
  ) {
    const product = products.find(
      (item) => item.id === productId,
    )
    const current = cart.find((item) => item.product_id === productId)
    if (!current) {
      return
    }

    setCartQuantity(productId, current.quantity + delta, product?.stock_quantity)
  }

  function setCartQuantity(
    productId: string,
    nextQuantity: number,
    maxQuantity = products.find((item) => item.id === productId)?.stock_quantity,
  ) {
    const cap = maxQuantity ?? Infinity
    const quantity = Math.min(Math.max(0, Math.floor(nextQuantity)), cap)

    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.product_id === productId ? { ...item, quantity } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  // =========================================================
  // Remove From Cart
  // =========================================================

  function removeFromCart(productId: string) {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.product_id !== productId,
      ),
    )
  }

  // =========================================================
  // Sell
  // =========================================================

  async function handleSell(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (cart.length === 0) {
      return
    }

    if (isCredit && !customerId) {
      setSellError('การขายเชื่อต้องเลือกลูกค้า')
      return
    }

    if (isCredit) {
      const confirmed = window.confirm(
        `ยืนยันขายเชื่อให้ "${selectedCustomer?.full_name ?? ''}" ยอด ${cartTotal.toLocaleString()} บาท\n` +
          `หลังบิลนี้ลูกค้าจะมียอดค้างชำระ ${afterBill.toLocaleString()} บาท`,
      )
      if (!confirmed) {
        return
      }
    }

    setSellError(null)
    setSellSuccess(null)
    setIsSelling(true)

    try {
      const input: CreateSaleInput = {
        payment_method: paymentMethod,
        ...(customerId ? { customer_id: customerId } : {}),
        ...(isCredit
          ? {
              due_date: dueDate || undefined,
              credit_note: creditNote.trim() || undefined,
            }
          : {}),
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      }

      await apiClient.post('/sales', input)

      setSellSuccess(isCredit ? 'บันทึกขายเชื่อสำเร็จ ✓' : 'ขายสำเร็จ! ✓')

      setCart([])
      setCustomerId('')
      setDueDate('')
      setCreditNote('')
      // กลับเป็นเงินสดทุกครั้ง กันกดขายเชื่อซ้ำโดยไม่ตั้งใจ
      setPaymentMethod('CASH')

      // ดึงสต็อกและยอดค้างใหม่ ให้ตัวเลขตรงกับที่เพิ่งขาย
      void refetch()
      void refreshBalances()

      setTimeout(() => {
        setSellSuccess(null)
      }, 3000)
    } catch (err) {
      if (err instanceof ApiError) {
        setSellError(err.message)
      } else {
        setSellError('บันทึกการขายไม่สำเร็จ')
      }
    } finally {
      setIsSelling(false)
    }
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* =====================================================
          Products
      ====================================================== */}

      <div className="min-w-0 flex-1">
        <h1 className="mb-4 text-2xl font-semibold text-ink-900">
          ขายสินค้า
        </h1>

        {/* Sticky search + category bar */}
        <div className="sticky top-0 z-10 -mx-1 bg-surface px-1 pb-3 pt-1">
          <Input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="mb-3 max-w-sm"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            }
          />

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                selectedCategoryId === null
                  ? 'bg-gold-500 text-brand-900'
                  : 'bg-brand-50 text-ink-600 hover:bg-brand-100'
              }`}
            >
              ทั้งหมด
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  selectedCategoryId === category.id
                    ? 'bg-gold-500 text-brand-900'
                    : 'bg-brand-50 text-ink-600 hover:bg-brand-100'
                }`}
              >
                {category.category_name}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <p className="mb-4 text-sm text-ink-600">กำลังโหลดสินค้า...</p>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Product grid — scroll เฉพาะโซนนี้ */}
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock_quantity <= 0

              return (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  disabled={isOutOfStock}
                  className="rounded-lg border border-black/5 bg-white p-4 text-left shadow-sm transition-colors duration-150 hover:border-gold-400 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/5 disabled:hover:bg-white"
                >
                  <p className="font-medium text-ink-900">
                    {product.product_name}
                  </p>

                  <p className="text-sm text-ink-600">
                    {product.unit_price.toLocaleString()} บาท
                  </p>

                  <p className="text-xs text-ink-600/70">
                    สต็อก: {product.stock_quantity}
                  </p>

                  {isOutOfStock && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      สินค้าหมด
                    </p>
                  )}
                </button>
              )
            })}

            {filteredProducts.length === 0 && !isLoading && (
              <p className="col-span-full text-ink-600/70">ไม่พบสินค้า</p>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          Cart
      ====================================================== */}

      <div className="w-full lg:w-80 lg:shrink-0">
        <Card className="p-4 lg:sticky lg:top-4">
          <h2 className="mb-3 font-semibold text-ink-900">
            ตะกร้า ({cartTotalItems} ชิ้น)
          </h2>

          <ul className="mb-4 space-y-3">
            {cart.map((item) => (
              <li
                key={item.product_id}
                className="border-b border-brand-100 pb-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-ink-900">
                    {item.product_name}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    ลบ
                  </button>
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-brand-50 text-ink-900 transition-colors duration-150 hover:bg-brand-100"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={
                        products.find((product) => product.id === item.product_id)
                          ?.stock_quantity ?? undefined
                      }
                      value={item.quantity}
                      onChange={(event) => {
                        const raw = event.target.value
                        if (raw === '') {
                          return
                        }
                        const parsed = Number(raw)
                        if (!Number.isFinite(parsed)) {
                          return
                        }
                        setCartQuantity(item.product_id, parsed)
                      }}
                      onBlur={(event) => {
                        if (event.target.value === '') {
                          setCartQuantity(item.product_id, 1)
                        }
                      }}
                      className="h-7 w-14 rounded-lg border border-brand-100 bg-white text-center text-sm text-ink-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-brand-50 text-ink-900 transition-colors duration-150 hover:bg-brand-100"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-ink-600">
                    {(item.unit_price * item.quantity).toLocaleString()} บาท
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {cart.length === 0 && (
            <p className="text-sm text-ink-600/70">ยังไม่มีสินค้าในตะกร้า</p>
          )}

          {/* =================================================
              Payment
          ================================================== */}

          {cart.length > 0 && (
            <form onSubmit={handleSell} className="border-t border-brand-100 pt-3">
              <div className="mb-3 flex items-center justify-between text-lg font-bold text-ink-900">
                <span>ยอดรวม</span>
                <span>{cartTotal.toLocaleString()} บาท</span>
              </div>

              <div className="mb-3">
                <Select
                  id="payment-method"
                  label="วิธีชำระเงิน"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as PaymentMethod)
                  }
                  disabled={isSelling}
                  className="w-full"
                >
                  <option value="CASH">เงินสด</option>
                  <option value="TRANSFER">โอนเงิน</option>
                  <option value="CARD">บัตร</option>
                  {creditAllowed && (
                    <option value="CREDIT">ขายเชื่อ (ค้างชำระ)</option>
                  )}
                </Select>
              </div>

              <div className="mb-3">
                <Select
                  id="sale-customer"
                  label={
                    isCredit
                      ? 'ลูกค้า (จำเป็นสำหรับขายเชื่อ)'
                      : 'ลูกค้า (ไม่บังคับ)'
                  }
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  disabled={isSelling}
                  className="w-full"
                >
                  <option value="">
                    {isCredit ? '— เลือกลูกค้า —' : 'ลูกค้าทั่วไป'}
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name}
                      {customer.phone ? ` (${customer.phone})` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              {paymentMethod === 'TRANSFER' && (
                <div className="mb-3 flex flex-col items-center rounded-lg border border-brand-100 bg-surface p-3">
                  <QRCodeSVG
                    value={getPromptPayPayload(cartTotal)}
                    size={180}
                  />
                  <p className="mt-2 text-sm text-ink-600">
                    สแกนเพื่อชำระ {cartTotal.toLocaleString()} บาท
                  </p>
                </div>
              )}

              {isCredit && (
                <div className="mb-3 space-y-3">
                  {customerId && (
                    <div className="rounded-lg border border-brand-100 bg-surface p-3 text-sm">
                      <div className="flex justify-between text-ink-600">
                        <span>
                          {outstanding < 0 ? 'เครดิตคงเหลือของลูกค้า' : 'ยอดค้างเดิม'}
                        </span>
                        <span className="text-ink-900">
                          {Math.abs(outstanding).toLocaleString()} บาท
                        </span>
                      </div>
                      <div className="flex justify-between text-ink-600">
                        <span>บิลนี้</span>
                        <span className="text-ink-900">
                          {cartTotal.toLocaleString()} บาท
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between border-t border-brand-100 pt-1 font-semibold text-ink-900">
                        <span>ยอดค้างหลังบิลนี้</span>
                        <span>{afterBill.toLocaleString()} บาท</span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-ink-600">
                        <span>วงเงินเครดิต</span>
                        <span>
                          {creditLimit === null
                            ? 'ไม่จำกัด'
                            : `${creditLimit.toLocaleString()} บาท`}
                        </span>
                      </div>

                      {overLimit && (
                        <p className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
                          ยอดค้างหลังบิลนี้เกินวงเงิน ระบบจะไม่อนุญาตให้บันทึก
                        </p>
                      )}
                      {overdueAmount > 0 && (
                        <p className="mt-2 rounded-md bg-gold-500/15 px-2 py-1.5 text-xs text-gold-600">
                          ลูกค้ามียอดเลยกำหนดชำระ {overdueAmount.toLocaleString()} บาท
                        </p>
                      )}
                      {balancesError && (
                        <p className="mt-2 text-xs text-red-600">
                          โหลดยอดค้างของลูกค้าไม่สำเร็จ ตัวเลขข้างบนอาจไม่ครบ
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Input
                      id="credit-due-date"
                      label="กำหนดชำระ (ไม่บังคับ)"
                      type="date"
                      min={todayInThailand()}
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      disabled={isSelling}
                      className="w-full"
                    />
                    <div className="mt-1.5 flex gap-1.5">
                      {[7, 15, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setDueDate(addDaysThai(days))}
                          className="rounded-full border border-brand-100 px-2.5 py-1 text-xs text-ink-600 transition-colors hover:border-gold-400 hover:text-brand-900"
                        >
                          {days} วัน
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    id="credit-note"
                    label="หมายเหตุ (ไม่บังคับ)"
                    rows={2}
                    maxLength={500}
                    value={creditNote}
                    onChange={(event) => setCreditNote(event.target.value)}
                    disabled={isSelling}
                    placeholder="เช่น สัญญาจ่ายวันเงินเดือนออก"
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={
                  isSelling || cart.length === 0 || (isCredit && !customerId)
                }
                className="w-full"
              >
                {isSelling
                  ? 'กำลังบันทึก...'
                  : isCredit
                    ? 'บันทึกขายเชื่อ'
                    : 'ยืนยันการขาย'}
              </Button>

              {sellError && (
                <p className="mt-2 text-sm text-red-600">{sellError}</p>
              )}
            </form>
          )}

          {/* Success — วางไว้นอกเงื่อนไขตะกร้า เพื่อให้แสดงได้แม้ตะกร้าถูกล้างแล้ว */}
          {sellSuccess && (
            <p className="mt-3 text-sm font-medium text-green-600">
              {sellSuccess}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}