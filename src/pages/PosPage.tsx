import { useState, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getPromptPayPayload } from '../lib/promptpay'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'

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

  const { products, isLoading, error } = useProducts()
  const { categories } = useCategories()

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

  const [isSelling, setIsSelling] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)
  const [sellSuccess, setSellSuccess] = useState(false)

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

    return matchesSearch && matchesCategory
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

    const maxQuantity =
      product?.stock_quantity ?? Infinity

    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (item.product_id !== productId) {
            return item
          }

          const newQuantity = Math.min(
            item.quantity + delta,
            maxQuantity,
          )

          return {
            ...item,
            quantity: newQuantity,
          }
        })
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

    setSellError(null)
    setSellSuccess(false)
    setIsSelling(true)

    try {
      const input: CreateSaleInput = {
        payment_method: paymentMethod,

        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      }

      await apiClient.post('/sales', input)

      setCart([])
      setSellSuccess(true)

      setTimeout(() => {
        setSellSuccess(false)
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
    <div className="flex gap-6">
      {/* =====================================================
          Products
      ====================================================== */}

      <div className="flex-1">
        <h1 className="mb-4 text-2xl font-bold">
          ขายสินค้า
        </h1>

        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          className="mb-4 w-full max-w-sm rounded border px-3 py-2"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={`rounded-full px-3 py-1 text-sm ${
              selectedCategoryId === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            ทั้งหมด
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() =>
                setSelectedCategoryId(category.id)
              }
              className={`rounded-full px-3 py-1 text-sm ${
                selectedCategoryId === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {category.category_name}
            </button>
          ))}
        </div>

        {isLoading && (
          <p className="mb-4 text-gray-500">
            กำลังโหลดสินค้า...
          </p>
        )}

        {error && (
          <p className="mb-4 text-red-600">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {filteredProducts.map((product) => {
            const isOutOfStock =
              product.stock_quantity <= 0

            return (
              <button
                type="button"
                key={product.id}
                onClick={() =>
                  addToCart(product.id)
                }
                disabled={isOutOfStock}
                className="rounded bg-white p-4 text-left shadow hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <p className="font-medium">
                  {product.product_name}
                </p>

                <p className="text-sm text-gray-500">
                  {product.unit_price.toLocaleString()} บาท
                </p>

                <p className="text-xs text-gray-400">
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

          {filteredProducts.length === 0 &&
            !isLoading && (
              <p className="col-span-full text-gray-400">
                ไม่พบสินค้า
              </p>
            )}
        </div>
      </div>

      {/* =====================================================
          Cart
      ====================================================== */}

      <div className="h-fit w-72 rounded bg-white p-4 shadow">
        <h2 className="mb-3 font-bold">
          ตะกร้า ({cartTotalItems} ชิ้น)
        </h2>

        <ul className="mb-4 space-y-3">
          {cart.map((item) => (
            <li
              key={item.product_id}
              className="border-b pb-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">
                  {item.product_name}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    removeFromCart(item.product_id)
                  }
                  className="text-xs text-red-500 hover:underline"
                >
                  ลบ
                </button>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.product_id,
                        -1,
                      )
                    }
                    className="h-6 w-6 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    -
                  </button>

                  <span className="min-w-5 text-center">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.product_id,
                        1,
                      )
                    }
                    className="h-6 w-6 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>

                <span className="text-gray-600">
                  {(
                    item.unit_price *
                    item.quantity
                  ).toLocaleString()}{' '}
                  บาท
                </span>
              </div>
            </li>
          ))}
        </ul>

        {cart.length === 0 && (
          <p className="text-sm text-gray-400">
            ยังไม่มีสินค้าในตะกร้า
          </p>
        )}

        {/* ===================================================
            Payment
        ==================================================== */}

        {cart.length > 0 && (
          <form
            onSubmit={handleSell}
            className="border-t pt-3"
          >
            <div className="mb-3 flex items-center justify-between text-lg font-bold">
              <span>ยอดรวม</span>

              <span>
                {cartTotal.toLocaleString()} บาท
              </span>
            </div>

            <label
              htmlFor="payment-method"
              className="mb-1 block text-sm"
            >
              วิธีชำระเงิน
            </label>

            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value as PaymentMethod,
                )
              }
              disabled={isSelling}
              className="mb-3 w-full rounded border px-2 py-1"
            >
              <option value="CASH">
                เงินสด
              </option>

              <option value="TRANSFER">
                โอนเงิน
              </option>

              <option value="CARD">
                บัตร
              </option>
            </select>

            {paymentMethod === 'TRANSFER' && (
              <div className="mb-3 flex flex-col items-center rounded border bg-gray-50 p-3">
                <QRCodeSVG
                  value={getPromptPayPayload(cartTotal)}
                  size={180}
                />
                <p className="mt-2 text-sm text-gray-600">
                  สแกนเพื่อชำระ {cartTotal.toLocaleString()} บาท
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSelling || cart.length === 0}
              className="w-full rounded bg-green-600 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSelling
                ? 'กำลังบันทึก...'
                : 'ยืนยันการขาย'}
            </button>

            {sellError && (
              <p className="mt-2 text-sm text-red-600">
                {sellError}
              </p>
            )}
          </form>
        )}

        {/* Success — วางไว้นอกเงื่อนไขตะกร้า
            เพื่อให้แสดงได้แม้ตะกร้าจะถูกล้างว่างไปแล้ว */}
        {sellSuccess && (
          <p className="mt-3 text-sm font-medium text-green-600">
            ขายสำเร็จ! ✓
          </p>
        )}
      </div>
    </div>
  )
}