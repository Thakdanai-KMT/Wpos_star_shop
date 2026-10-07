import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Product } from '../types/product'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'

export default function ProductsPage() {
  const { products, isLoading, error, createProduct, updateProduct, setProductActive } =
    useProducts()
  const { categories } = useCategories()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // editingId = null คือโหมด "เพิ่มใหม่", ถ้ามีค่าคือโหมด "กำลังแก้ไข" สินค้า id นี้อยู่
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')

  // สินค้าแพ็ก
  const [isBundle, setIsBundle] = useState(false)
  const [bundleOfProductId, setBundleOfProductId] = useState('')
  const [bundleQuantity, setBundleQuantity] = useState('')

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>(
    'active',
  )

  // สินค้าที่เลือกเป็น "สินค้าฐาน" ได้ ต้องไม่ใช่ตัวเองที่กำลังแก้ และต้องไม่ใช่สินค้าแพ็กอยู่แล้ว (ห้ามซ้อนแพ็ก)
  const baseProductOptions = products.filter(
    (p) => p.id !== editingId && !p.bundle_of_product_id
  )

  function resetForm() {
    setEditingId(null)
    setProductName('')
    setUnitPrice('')
    setCostPrice('')
    setCategoryId('')
    setIsBundle(false)
    setBundleOfProductId('')
    setBundleQuantity('')
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setProductName(p.product_name)
    setUnitPrice(String(p.unit_price))
    setCostPrice(String(p.cost_price))
    setCategoryId(p.category_id)
    if (p.bundle_of_product_id && p.bundle_quantity) {
      setIsBundle(true)
      setBundleOfProductId(p.bundle_of_product_id)
      setBundleQuantity(String(p.bundle_quantity))
    } else {
      setIsBundle(false)
      setBundleOfProductId('')
      setBundleQuantity('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      const input = {
        product_name: productName,
        unit_price: Number(unitPrice),
        cost_price: Number(costPrice),
        category_id: categoryId,
        ...(isBundle
          ? {
              bundle_of_product_id: bundleOfProductId,
              bundle_quantity: Number(bundleQuantity),
            }
          : {}),
      }
      if (editingId) {
        await updateProduct(editingId, input)
      } else {
        await createProduct(input)
      }
      resetForm()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'บันทึกข้อมูลไม่สำเร็จ'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(p: Product) {
    const nextActive = !p.is_active
    const packChildren = products.filter((x) => x.bundle_of_product_id === p.id)
    const isPack = Boolean(p.bundle_of_product_id)
    let confirmMessage: string

    if (nextActive) {
      confirmMessage = `เปิดใช้งาน "${p.product_name}" อีกครั้งหรือไม่?`
    } else if (isPack) {
      confirmMessage = `ปิดการใช้งานแพ็ก "${p.product_name}" หรือไม่?\nบิลและประวัติขายเดิมจะยังอยู่`
    } else if (packChildren.length > 0) {
      const names = packChildren.map((x) => x.product_name).join(', ')
      confirmMessage =
        `"${p.product_name}" เป็นสินค้าฐานของแพ็ก: ${names}\n\n` +
        `ถ้าต้องการเลิกขายแพ็ก ให้กดยกเลิก แล้วไปกด "ปิดการใช้งาน" ที่แถวที่มีป้ายแพ็ก\n` +
        `ถ้าปิดสินค้าฐานนี้ แพ็กที่ผูกอยู่จะยังขายได้ บิลเก่าจะยังอยู่\n\nดำเนินการต่อหรือไม่?`
    } else {
      confirmMessage = `ปิดการใช้งาน "${p.product_name}" หรือไม่?\nบิลและประวัติขายเดิมจะยังอยู่`
    }

    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return

    setTogglingId(p.id)
    try {
      await setProductActive(p.id, nextActive)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'เปลี่ยนสถานะไม่สำเร็จ')
    } finally {
      setTogglingId(null)
    }
  }

  function getBaseProductName(id: string) {
    return products.find((p) => p.id === id)?.product_name ?? '(ไม่พบสินค้า)'
  }

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? product.is_active
            : !product.is_active

      const matchesCategory =
        !selectedCategoryId || product.category_id === selectedCategoryId

      if (!q) {
        return matchesStatus && matchesCategory
      }

      const baseName = product.bundle_of_product_id
        ? getBaseProductName(product.bundle_of_product_id)
        : ''
      const matchesSearch =
        product.product_name.toLowerCase().includes(q) ||
        baseName.toLowerCase().includes(q)

      return matchesStatus && matchesCategory && matchesSearch
    })
  }, [products, searchTerm, selectedCategoryId, statusFilter])

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-ink-900">จัดการสินค้า</h1>

      {canManage && (
        <Card className="mb-6 p-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:flex-1">
              <Input
                label="ชื่อสินค้า"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="w-28">
              <Input
                label="ราคาขาย"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </div>

            <div className="w-28">
              <Input
                label="ราคาต้นทุน"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />
            </div>

            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <Select
                label="หมวดหมู่"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
            </div>

            {/* สินค้าแพ็ก */}
            <div className="w-full rounded-lg bg-surface p-3">
              <label className="flex items-center gap-2 text-sm text-ink-900">
                <input
                  type="checkbox"
                  checked={isBundle}
                  onChange={(e) => setIsBundle(e.target.checked)}
                  className="h-4 w-4 accent-gold-500"
                />
                สินค้านี้เป็นแพ็กของสินค้าอื่น (สต็อกจะคำนวณอัตโนมัติ ไม่ต้องกรอกเอง)
              </label>

              {isBundle && (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="w-full sm:w-auto sm:min-w-[200px]">
                    <Select
                      label="เป็นแพ็กของสินค้าฐาน"
                      value={bundleOfProductId}
                      onChange={(e) => setBundleOfProductId(e.target.value)}
                      required={isBundle}
                    >
                      <option value="">-- เลือกสินค้าฐาน --</option>
                      {baseProductOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-36">
                    <Input
                      label="จำนวนต่อแพ็ก"
                      type="number"
                      min={1}
                      value={bundleQuantity}
                      onChange={(e) => setBundleQuantity(e.target.value)}
                      required={isBundle}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? 'กำลังบันทึก...'
                : editingId
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มสินค้า'}
            </Button>

            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                ยกเลิก
              </Button>
            )}

            {formError && (
              <p className="w-full text-sm text-red-600">{formError}</p>
            )}
          </form>
        </Card>
      )}

      {isLoading && <p className="text-sm text-ink-600">กำลังโหลด...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          <div className="border-b border-brand-100 bg-surface/60 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้าหรือแพ็ก..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
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
              </div>

              <Select
                label="หมวดหมู่"
                value={selectedCategoryId ?? ''}
                onChange={(event) =>
                  setSelectedCategoryId(event.target.value || null)
                }
                className="w-full min-w-[180px] lg:w-52"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </Select>

              <div>
                <p className="mb-1.5 text-sm text-ink-600">สถานะ</p>
                <div className="inline-flex rounded-lg border border-brand-100 bg-white p-0.5">
                  {(
                    [
                      { id: 'active', label: 'ใช้งาน' },
                      { id: 'inactive', label: 'ปิดใช้งาน' },
                      { id: 'all', label: 'ทั้งหมด' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStatusFilter(option.id)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                        statusFilter === option.id
                          ? 'bg-gold-500 text-brand-900'
                          : 'text-ink-600 hover:bg-brand-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-600">
              แสดง {filteredProducts.length} จาก {products.length} รายการ
              {statusFilter === 'active' ? ' · ซ่อนสินค้าที่ปิดใช้งานไว้' : ''}
            </p>
          </div>

          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-brand-100 text-left text-sm text-ink-600">
                <th className="p-3 font-medium">ชื่อสินค้า</th>
                <th className="p-3 font-medium">ราคาขาย</th>
                <th className="p-3 font-medium">ต้นทุน</th>
                <th className="p-3 font-medium">สต็อก</th>
                <th className="p-3 font-medium">สถานะ</th>
                {canManage && <th className="p-3 font-medium">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-brand-100 text-sm ${p.is_active ? '' : 'opacity-50'}`}
                >
                  <td className="p-3 text-ink-900">
                    {p.product_name}
                    {p.bundle_of_product_id && (
                      <span className="ml-2 inline-block rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-medium text-gold-600">
                        แพ็ก {p.bundle_quantity} × {getBaseProductName(p.bundle_of_product_id)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-ink-900">{p.unit_price.toLocaleString()}</td>
                  <td className="p-3 text-ink-900">{p.cost_price.toLocaleString()}</td>
                  <td className="p-3 text-ink-900">{p.stock_quantity}</td>
                  <td className="p-3">
                    {p.is_active ? (
                      <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        ใช้งาน
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-ink-600/10 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                        ปิดใช้งาน
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-sm text-brand-700 hover:underline"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={togglingId === p.id}
                          className={`text-sm hover:underline disabled:opacity-50 ${
                            p.is_active ? 'text-red-600' : 'text-brand-700'
                          }`}
                        >
                          {togglingId === p.id
                            ? 'กำลังบันทึก...'
                            : p.is_active
                              ? p.bundle_of_product_id
                                ? 'ปิดการใช้งานแพ็ก'
                                : 'ปิดการใช้งาน'
                              : 'เปิดใช้งาน'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="p-3 text-center text-ink-600/70"
                  >
                    {products.length === 0
                      ? 'ยังไม่มีสินค้า'
                      : 'ไม่พบสินค้าตามคำค้นหาหรือตัวกรอง'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}