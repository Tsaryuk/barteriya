"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TARIFFS } from "@/lib/mock-data";
import { formatRubles } from "@/lib/utils";
import { TelegramLoginButton, DevLoginButton } from "@/components/telegram-login";
import {
  ArrowRightLeft,
  Users,
  Zap,
  ShieldCheck,
  Trophy,
  ChevronDown,
  Sparkles,
  Handshake,
  BarChart3,
  Star,
  Check,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Stats />
      <Tariffs />
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
          <a href="#tariffs" className="hover:text-warm-800 transition-colors">Тарифы</a>
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
      {/* Floating coins decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-24 left-[10%] w-16 h-16 rounded-full bg-brand-amber/10 animate-float" />
        <div className="absolute top-40 right-[15%] w-12 h-12 rounded-full bg-brand-gold/15 animate-float-delayed" />
        <div className="absolute bottom-20 left-[20%] w-10 h-10 rounded-full bg-brand-amber/8 animate-float" />
        <div className="absolute top-32 right-[35%] w-8 h-8 rounded-full bg-brand-sage/10 animate-float-delayed" />
        <div className="absolute bottom-32 right-[10%] w-14 h-14 rounded-full bg-brand-gold/10 animate-float" />
        {/* Grid pattern */}
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
            Следующая игра 24 марта
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
          <a href="#how" className="inline-flex items-center gap-2 text-sm text-warm-400 hover:text-warm-600 transition-colors mt-2">
            Узнать больше
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Hero mini-stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: "623+", label: "участников" },
            { value: "2 840+", label: "сделок" },
            { value: "14.2M", label: "Бартеров в обороте" },
          ].map((stat) => (
            <div key={stat.label} className="animate-fade-in">
              <div className="font-display font-bold text-3xl md:text-4xl text-warm-800">
                {stat.value}
              </div>
              <div className="text-sm text-warm-400 mt-1">{stat.label}</div>
            </div>
          ))}
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
      desc: "На мероприятии обменяй рубли на игровую валюту. Курс 1:10 — 1 000 ₽ = 10 000 Б.",
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
      desc: "Услуга оказана — продавец активирует сертификат. Остаток Бартеров меняем обратно.",
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

        {/* Exchange rate callout */}
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

/* ─── Stats ───────────────────────────────────────────── */

function Stats() {
  const stats = [
    { icon: <Users className="w-5 h-5" />, value: "623+", label: "Участников в базе", color: "text-sky-600 bg-sky-50" },
    { icon: <Trophy className="w-5 h-5" />, value: "12", label: "Игр проведено", color: "text-amber-600 bg-amber-50" },
    { icon: <Handshake className="w-5 h-5" />, value: "2 840+", label: "Совершено сделок", color: "text-emerald-600 bg-emerald-50" },
    { icon: <BarChart3 className="w-5 h-5" />, value: "14.2M Б", label: "Оборот Бартеров", color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <section className="py-20 md:py-28 bg-cream relative bg-noise">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-3xl p-6 text-center shadow-card border border-warm-200/40">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                {stat.icon}
              </div>
              <div className="font-display font-bold text-2xl md:text-3xl text-warm-800 mb-1">{stat.value}</div>
              <div className="text-xs text-warm-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Tariffs ─────────────────────────────────────────── */

function Tariffs() {
  return (
    <section id="tariffs" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Тарифы</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-warm-800 mb-3">
            Выбери свою дозу
          </h2>
          <p className="text-warm-400 max-w-lg mx-auto">
            Тариф = доступ ко всем играм клуба. Бартеры покупаются отдельно на каждом мероприятии.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          {TARIFFS.map((tariff) => (
            <div
              key={tariff.id}
              className={`relative bg-white rounded-3xl p-6 border-2 transition-all duration-300 hover:-translate-y-1 ${
                tariff.popular
                  ? "border-brand-amber shadow-warm"
                  : "border-warm-200/60 shadow-card hover:shadow-card-hover"
              }`}
            >
              {tariff.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="amber" className="shadow-warm">
                    <Star className="w-3 h-3 mr-1" />
                    Хит продаж
                  </Badge>
                </div>
              )}

              <div className="mb-4 pt-1">
                <div className="text-xs text-warm-400 mb-1 uppercase tracking-wider">{tariff.duration}</div>
                <h3 className="font-display font-semibold text-warm-800 text-lg leading-tight">
                  {tariff.name}
                </h3>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-3xl text-warm-800">
                    {formatRubles(tariff.price)}
                  </span>
                </div>
                {tariff.originalPrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-warm-400 line-through">
                      {formatRubles(tariff.originalPrice)}
                    </span>
                    <Badge variant="sage" className="text-[10px]">{tariff.note}</Badge>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-6">
                {tariff.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-warm-500">
                    <Check className="w-4 h-4 text-brand-sage shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={tariff.popular ? "primary" : "outline"}
                size="sm"
                className="w-full"
              >
                Выбрать
              </Button>
            </div>
          ))}
        </div>
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
    <section className="py-20 md:py-28 bg-cream relative bg-noise">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
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
    { q: "Что такое Бартер?", a: "Бартер -- игровая валюта для обмена услугами. Курс: 1 000 ₽ = 10 000 Бартеров. Покупаете на мероприятии, меняете на услуги, остаток возвращаете." },
    { q: "Как проходит мероприятие?", a: "2--4 часа офлайн. Питч-сессия (2 мин на каждого), затем свободное общение и заключение сделок. Всё фиксируется в приложении." },
    { q: "Что если услуга не оказана?", a: "Каждая сделка подтверждается сертификатом. Продавец активирует его после выполнения. Споры решаются по ГК РФ." },
    { q: "Можно ли перенести Бартеры на следующую игру?", a: "Нет. В конце мероприятия остаток конвертируется обратно в рубли. Каждая игра -- отдельный цикл." },
    { q: "Какие услуги можно предлагать?", a: "Любые профессиональные: дизайн, маркетинг, юридические, бухгалтерские, IT-разработка, коучинг, фото -- всё, что вы умеете." },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
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
      className="w-full text-left bg-cream-100 rounded-2xl p-5 transition-all hover:bg-cream-200"
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
          Присоединяйся к 623+ предпринимателям, которые уже обмениваются через Бартерию.
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
                <a href="#tariffs" className="block hover:text-white transition-colors">Тарифы</a>
                <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Контакты</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition-colors">@barteria_bot</a>
                <a href="#" className="block hover:text-white transition-colors">info@barteriya.ru</a>
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
