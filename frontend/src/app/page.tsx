import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SparklesIcon, BoltIcon, ClockIcon, ChevronRightIcon } from "@/components/Icons";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero — full viewport, asymmetric layout */}
        <section className="relative flex min-h-screen items-center overflow-hidden bg-[#F7F7FF] px-6 pt-16 md:px-12 lg:px-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#BDD5EA]/25" />
            <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-[#BDD5EA]/15" />
          </div>
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#FE5F55]">
                AI Recipe Recommendation
              </p>
              <h1 className="mb-6 text-5xl font-extrabold leading-[1.15] tracking-tight text-[#495867] md:text-7xl">
                오늘 기분,
                <br />
                <span className="text-[#FE5F55]">어떤 맛?</span>
              </h1>
              <p className="mb-10 max-w-md text-lg leading-relaxed text-[#577399]">
                기분을 알려주세요.
                <br />
                AI가 당신의 감정에 딱 맞는
                <br />
                레시피를 추천해 드립니다.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/mood"
                  className="inline-flex items-center gap-2 rounded-full bg-[#FE5F55] px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-[#e5534b] hover:shadow-xl"
                >
                  레시피 받기
                  <ChevronRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="text-sm font-medium text-[#577399] transition-colors hover:text-[#495867]"
                >
                  더 알아보기
                </Link>
              </div>
            </div>
            <div className="hidden justify-end md:flex">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-[#BDD5EA]/20" />
                <Image
                  src="/logo-optimized.png"
                  alt="Moodish"
                  width={360}
                  height={277}
                  className="relative"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features — full viewport */}
        <section id="features" className="flex min-h-screen items-center bg-white px-6 md:px-12 lg:px-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-16 max-w-lg">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#FE5F55]">
                Features
              </p>
              <h2 className="mb-4 text-4xl font-bold text-[#495867]">
                Moodish는
                <br />
                이런 서비스예요
              </h2>
              <p className="text-[#577399]">
                매일 반복되는 &ldquo;오늘 뭐 먹지?&rdquo;를 새로운 방식으로 해결합니다.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<SparklesIcon className="h-8 w-8 text-[#FE5F55]" />}
                title="AI 맞춤 레시피"
                description="GPT 기반 AI가 기분과 상황을 분석하여 한국형 맞춤 레시피를 생성합니다."
              />
              <FeatureCard
                icon={<BoltIcon className="h-8 w-8 text-[#FE5F55]" />}
                title="기분 기반 추천"
                description="단순 검색이 아닌, 오늘의 감정에 어울리는 음식을 찾아드립니다."
              />
              <FeatureCard
                icon={<ClockIcon className="h-8 w-8 text-[#FE5F55]" />}
                title="빠르고 간편하게"
                description="기분을 선택하고, 잠시 기다리면 따뜻한 레시피가 완성됩니다."
              />
            </div>
          </div>
        </section>

        {/* How it works — full viewport */}
        <section className="flex min-h-screen items-center bg-[#BDD5EA]/10 px-6 md:px-12 lg:px-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-16 text-right">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#FE5F55]">
                How It Works
              </p>
              <h2 className="mb-4 text-4xl font-bold text-[#495867]">
                이렇게 사용해요
              </h2>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              <StepCard number="01" title="기분 선택" description="오늘 느끼는 감정을 골라주세요. 텍스트로 자유롭게 적어도 됩니다." />
              <StepCard number="02" title="AI 분석" description="AI 셰프가 기분을 분석하고, 딱 맞는 한국 가정식 레시피를 만듭니다." />
              <StepCard number="03" title="레시피 완성" description="감성 메시지와 함께 완성된 레시피를 확인하고 공유하세요." />
            </div>
          </div>
        </section>

        {/* CTA — full viewport */}
        <section className="flex min-h-screen items-center bg-[#FE5F55] px-6 md:px-12 lg:px-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-xl">
              <h2 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
                지금 바로
                <br />
                시작해보세요
              </h2>
              <p className="mb-10 text-lg text-white/80">
                회원가입 없이, 기분만 알려주면 됩니다.
              </p>
              <Link
                href="/mood"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-[#FE5F55] shadow-lg transition-all hover:bg-[#F7F7FF] hover:shadow-xl"
              >
                무료로 시작하기
                <ChevronRightIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-[#BDD5EA]/50 bg-[#F7F7FF] p-8 transition-shadow hover:shadow-md">
      <div className="mb-5">{icon}</div>
      <h3 className="mb-2 text-lg font-bold text-[#495867]">{title}</h3>
      <p className="text-sm leading-relaxed text-[#577399]">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-[#FE5F55] shadow-sm">
        {number}
      </div>
      <h3 className="mb-2 text-lg font-bold text-[#495867]">{title}</h3>
      <p className="text-sm leading-relaxed text-[#577399]">{description}</p>
    </div>
  );
}
