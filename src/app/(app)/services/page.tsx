"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, DBService } from "@/lib/api";
import { formatBarters, formatRubles } from "@/lib/utils";
import { ChevronLeft, Plus, Loader2, Package, Trash2, Infinity } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

export default function ServicesPage() {
  const [services, setServices] = useState<DBService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api.getMyServices()
      .then((data) => {
        setServices(data.filter((s) => s.is_active));
      })
      .catch((err) => {
        setError(err.message || "Не удалось загрузить услуги");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await api.deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-warm-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> Профиль
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Мои предложения</h1>
          <p className="text-sm text-warm-400">Сертификаты, которые ты предлагаешь на играх</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Новое
        </Button>
      </div>

      {showForm && (
        <ServiceForm
          onSave={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {error && (
        <Card className="text-center py-8">
          <p className="text-brand-coral text-sm mb-3">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>Повторить</Button>
        </Card>
      )}

      {!error && services.length === 0 && !showForm && (
        <Card className="text-center py-12">
          <Package className="w-10 h-10 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-400 mb-4">У тебя пока нет предложений</p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Создать первое
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {services.map((s) => (
          <Card key={s.id} className="relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-display font-semibold text-warm-800 mb-1">{s.title}</h3>
                {s.description && <p className="text-sm text-warm-500 mb-2">{s.description}</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="amber">{formatBarters(s.price_b)}</Badge>
                  {s.original_price_rub && (
                    <span className="text-xs text-warm-400">= {formatRubles(s.original_price_rub)} в жизни</span>
                  )}
                  <span className="text-xs text-warm-400 flex items-center gap-1">
                    {s.quantity === null ? (
                      <><Infinity className="w-3 h-3" /> шт</>
                    ) : (
                      <>{s.quantity} шт</>
                    )}
                  </span>
                  <span className="text-xs text-warm-400">{s.expires_days} дн.</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-2 text-warm-300 hover:text-brand-coral transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ServiceForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceB, setPriceB] = useState("");
  const [originalPriceRub, setOriginalPriceRub] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiresDays, setExpiresDays] = useState("365");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceB) return;
    setSaving(true);
    try {
      await api.createService({
        title,
        description: description || undefined,
        price_b: Number(priceB),
        original_price_rub: originalPriceRub ? Number(originalPriceRub) : undefined,
        quantity: quantity ? Number(quantity) : undefined,
        expires_days: expiresDays ? Number(expiresDays) : undefined,
      });
      onSave();
    } catch (err) {
      console.error("Save error:", err);
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-amber/40";

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-warm-500 mb-1 block">Название услуги *</label>
          <input className={inputClass} placeholder="Консультация по маркетингу" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-warm-500 mb-1 block">Описание</label>
          <textarea className={inputClass} rows={2} placeholder="Что входит в услугу..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 block">Цена (Бартеры) *</label>
            <input className={inputClass} type="number" min="1" placeholder="10000" value={priceB} onChange={(e) => setPriceB(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 block">Цена в жизни (P)</label>
            <input className={inputClass} type="number" min="0" placeholder="100000" value={originalPriceRub} onChange={(e) => setOriginalPriceRub(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 block">Количество</label>
            <input className={inputClass} type="number" min="1" placeholder="Безлимит" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 block">Срок (дней)</label>
            <input className={inputClass} type="number" min="1" placeholder="365" value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Отмена</Button>
        </div>
      </form>
    </Card>
  );
}
