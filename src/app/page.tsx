"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRubles } from "@/lib/utils";
import { TelegramLoginButton, DevLoginButton } from "@/components/telegram-login";
import { api, type DBGame } from "@/lib/api";
import {
  ArrowRightLeft,
  Users,
  Zap,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Handshake,
  ArrowRight,
  MessageCircle,
  Calendar,
  MapPin,
  Loader2,
  Ticket,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <HowItWorks />
      <GamesSection />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-xl border-b border-warm-200/40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-amber flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-semibold text-warm-800 text-lg">Бартерия</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-warm-500">
          <a href="#how" className="hover:text-warm-800 transition-colors">Как это работает</a>
          <a href="#games" className="hover:text-warm-800 transition-colors">Игры</a>
          <a href="#faq" className="hover:text-warm-800 transition-colors">FAQ</a>
        </div>
        <a href="#cta" className="text-sm font-medium text-brand-amber hover:text-brand-amber/80 transition-colors">Войти</a>
      </div>
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="hero-gradient pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-24 left-[10%] w-16 h-16 rounded-full bg-brand-amber/10 animate-float" />
        <div className="absolute top-40 right-[15%] w-12 h-12 rounded-full bg-brand-gold/15 animate-float-delayed" />
        <div className="absolute bottom-20 left-[20%] w-10 h-10 rounded-full bg-brand-amber/8 animate-float" />
        <div className="absolute top-32 right-[35%] w-8 h-8 rounded-full bg-brand-sage/10 animate-float-delayed" />
        <div className="absolute bottom-32 right-[10%] w-14 h-14 rounded-full bg-brand-gold/10 animate-float" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #2D2A24 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 text-center relative">
        <div className="animate-slide-up">
          <Badge variant="amber" className="mb-6 text-sm px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Живая игра обмена
          </Badge>
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl text-warm-900 mb-6 animate-slide-up-delayed tracking-tight">
          Барт
          <span className="text-gradient">ерия</span>
        </h1>

        <p className="text-lg md:text-xl text-warm-500 max-w-2xl mx-auto mb-10 animate-slide-up-delayed-2 leading-relaxed">
          Живая клубная игра, где предприниматели обмениваются услугами
          через игровую валюту <span className="text-brand-amber font-semibold">Бартер</span>.
          Без барьеров. Только ценность.
        </p>

        <div className="flex flex-col items-center gap-4 animate-slide-up-delayed-2">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <TelegramLoginButton />
            <DevLoginButton />
          </div>
          <a href="#games" className="inline-flex items-center gap-2 text-sm text-warm-400 hover:text-warm-600 transition-colors mt-2">
            Ближайшие игры
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Зарегистрируйся",
      desc: "Войди через Telegram, заполни профиль и добавь свои предложения для обмена.",
      color: "bg-sky-50 text-sky-600",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Купи Бартеры",
      desc: "На мероприятии обменяй рубли на игровую валюту. Курс 1:10 -- 1 000 ₽ = 10 000 Б.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "Заключай сделки",
      desc: "Договаривайся, переводи Бартеры и получай сертификат на услугу.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Получи результат",
      desc: "Услуга оказана -- продавец активирует сертификат. Остаток Бартеров на балансе.",
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <section id="how" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">4 простых шага</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-warm-800">
            Как это работает
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {steps.map((step, i) => (
            <Card key={i} hover className="text-center group">
              <div className="flex flex-col items-center">
                <div className="relative mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center text-xs font-bold text-warm-500">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-warm-800 mb-2">{step.title}</h3>
                <p className="text-sm text-warm-400 leading-relaxed">{step.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-brand-amber-light rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-amber flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-semibold text-warm-800">Курс банка</div>
              <div className="text-sm text-warm-500">Фиксированный. Работает весь вечер.</div>
            </div>
          </div>
          <div className="font-display font-bold text-2xl md:text-3xl text-brand-amber">
            1 000 ₽ = 10 000 Б
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Games Section ──────────────────────────────────── */

function GamesSection() {
  const [games, setGames] = useState<DBGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGames()
      .then((data) => setGames(data.filter((g) => g.status === "open" || g.status === "active" || g.status === "draft")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="games" className="py-20 md:py-28 bg-cream relative bg-noise">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Расписание</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-warm-800 mb-3">
            Ближайшие игры
          </h2>
          <p className="text-warm-400 max-w-lg mx-auto">
            Выбери мероприятие, купи билет и приходи обмениваться.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-warm-400 mb-4">Пока нет запланированных игр</p>
            <p className="text-sm text-warm-300">Следите за обновлениями в Telegram</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {games.map((game) => {
              const date = new Date(game.event_date);
              const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
              const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
              const participantCount = game.participants?.length ?? 0;
              const statusMap: Record<string, { label: string; variant: "sage" | "amber" | "outline" }> = {
                open: { label: "Запись открыта", variant: "sage" },
                active: { label: "Идёт сейчас", variant: "amber" },
                draft: { label: "Скоро", variant: "outline" },
              };
              const status = statusMap[game.status] || statusMap.draft;

              return (
                <div
                  key={game.id}
                  className="bg-white rounded-3xl p-6 border-2 border-warm-200/60 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {game.max_participants && (
                      <span className="text-xs text-warm-400">
                        {participantCount}/{game.max_participants} мест
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-semibold text-warm-800 text-xl mb-2">
                    {game.title}
                  </h3>
                  {game.description && (
                    <p className="text-sm text-warm-400 mb-4 line-clamp-2">{game.description}</p>
                  )}

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-warm-500">
                      <Calendar className="w-4 h-4 text-warm-400" />
                      {dateStr}, {timeStr}
                    </div>
                    {game.location && (
                      <div className="flex items-center gap-2 text-sm text-warm-500">
                        <MapPin className="w-4 h-4 text-warm-400" />
                        {game.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-warm-500">
                      <Users className="w-4 h-4 text-warm-400" />
                      {participantCount} участников
                    </div>
                  </div>

                  {game.max_participants && (
                    <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-brand-amber rounded-full transition-all"
                        style={{ width: `${Math.min((participantCount / game.max_participants) * 100, 100)}%` }}
                      />
                    </div>
                  )}

                  {game.status === "open" && (
                    <a href="#cta">
                      <Button className="w-full">
                        <Ticket className="w-4 h-4" />
                        {game.ticket_price_rub > 0
                          ? `Купить участие · ${formatRubles(game.ticket_price_rub)}`
                          : "Записаться бесплатно"}
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────── */

function Testimonials() {
  const quotes = [
    { name: "Анна Б.", role: "Wellness-коуч", text: "За один вечер получила 4 клиента и заключила 6 сделок. Игровая механика реально снимает барьер!" },
    { name: "Дмитрий В.", role: "Копирайтер", text: "Обычно на нетворкингах обмениваешься визитками. Здесь -- сразу делаешь дело." },
    { name: "Сергей К.", role: "Разработчик", text: "Написал 3 бота для участников прямо на мероприятии. Бартеры реально работают." },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Отзывы</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-warm-800">
            Что говорят участники
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {quotes.map((q) => (
            <Card key={q.name} padding="lg">
              <MessageCircle className="w-8 h-8 text-brand-amber/20 mb-4" />
              <p className="text-warm-600 leading-relaxed mb-6">&laquo;{q.text}&raquo;</p>
              <div>
                <div className="font-semibold text-warm-800">{q.name}</div>
                <div className="text-xs text-warm-400">{q.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────── */

function FAQ() {
  const items = [
    { q: "Что такое Бартер?", a: "Бартер -- игровая валюта для обмена услугами. Курс: 1 000 ₽ = 10 000 Бартеров. Покупаете на мероприятии, меняете на услуги, остаток остается на балансе." },
    { q: "Как проходит мероприятие?", a: "2--4 часа офлайн. Питч-сессия (2 мин на каждого), затем свободное общение и заключение сделок. Все фиксируется в приложении." },
    { q: "Что если услуга не оказана?", a: "Каждая сделка подтверждается сертификатом. Продавец активирует его после выполнения. Споры решаются по ГК РФ." },
    { q: "Можно ли перенести Бартеры на следующую игру?", a: "Да! Бартеры остаются на вашем балансе и переносятся на следующие игры." },
    { q: "Какие услуги можно предлагать?", a: "Любые профессиональные: дизайн, маркетинг, юридические, бухгалтерские, IT-разработка, коучинг, фото -- все, что вы умеете." },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-cream relative bg-noise">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-warm-800">
            Частые вопросы
          </h2>
        </div>

        <div className="space-y-3 stagger-children">
          {items.map((item) => (
            <FAQItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-white rounded-2xl p-5 transition-all hover:shadow-card"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-warm-700">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-warm-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      {open && (
        <p className="mt-3 text-sm text-warm-500 leading-relaxed pr-8">{answer}</p>
      )}
    </button>
  );
}

/* ─── CTA ─────────────────────────────────────────────── */

function CTA() {
  return (
    <section id="cta" className="py-20 md:py-28 hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[15%] w-20 h-20 rounded-full bg-brand-amber/8 animate-float" />
        <div className="absolute bottom-10 right-[20%] w-16 h-16 rounded-full bg-brand-gold/10 animate-float-delayed" />
      </div>
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="font-display font-bold text-3xl md:text-5xl text-warm-800 mb-4">
          Готов к обмену?
        </h2>
        <p className="text-warm-500 mb-8 text-lg">
          Присоединяйся к предпринимателям, которые уже обмениваются через Бартерию.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <TelegramLoginButton />
          <DevLoginButton />
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-warm-800 text-warm-400 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-brand-amber flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-white text-lg">Бартерия</span>
            </div>
            <p className="text-sm max-w-xs">Живая игра обмена ресурсами для предпринимателей, экспертов и фрилансеров.</p>
          </div>
          <div className="flex gap-12">
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Навигация</h4>
              <div className="space-y-2 text-sm">
                <a href="#how" className="block hover:text-white transition-colors">Как это работает</a>
                <a href="#games" className="block hover:text-white transition-colors">Игры</a>
                <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Контакты</h4>
              <div className="space-y-2 text-sm">
                <a href="https://t.me/barteriya_bot" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors">@barteriya_bot</a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-warm-700 pt-6 text-xs text-warm-500">
          &copy; 2026 Бартерия. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
