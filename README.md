# Cloud Management System

Next.js 기반의 멀티 클라우드 관리 시스템으로, AWS, Azure, GCP 등 다양한 클라우드 제공자를 통합 관리할 수 있는 엔터프라이즈급 웹 애플리케이션입니다.

## 🚀 주요 기능

- **멀티 클라우드 지원**: AWS, Azure, GCP 등 주요 클라우드 제공자 통합 관리
- **다국어 지원**: 한국어, 영어, 일본어 지원 (next-intl 기반)
- **실시간 상태 관리**: TanStack Query를 활용한 효율적인 서버 상태 관리
- **타입 안전성**: TypeScript와 Zod를 활용한 엔드-투-엔드 타입 안전성
- **사용자 경험 최적화**: 낙관적 업데이트, 글로벌 로딩 인디케이터, 스켈레톤 UI 등

## 📋 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **상태 관리**: TanStack Query v5
- **UI 컴포넌트**: Radix UI, Tailwind CSS, shadcn/ui
- **폼 관리**: React Hook Form + Zod
- **국제화**: next-intl
- **테스트**: Playwright (E2E)
- **코드 품질**: ESLint, Prettier

---

## 🏗️ 아키텍처 특징

### 1. 효율적인 API 관리 시스템

대규모 엔터프라이즈 애플리케이션에서 수십~수백 개의 API를 체계적으로 관리하기 위한 3단계 접근법을 구현했습니다.

#### 1.1 타입 정의 (Type Definition)

모든 API 엔티티에 대한 타입을 먼저 정의하여 타입 안전성을 보장합니다.

```typescript
// src/types/types.ts
export interface Cloud {
  id: string
  name: string
  provider: CloudProvider
  status: CloudStatus
  regionList: string[]
  credentials: CloudCredentials
  // ... 기타 필드
}

export type CloudCreateRequest = Omit<Cloud, 'id' | 'createdAt' | 'updatedAt'>
export type CloudUpdateRequest = Partial<CloudCreateRequest>
```

#### 1.2 API 서비스 레이어 (Service Layer)

재사용 가능한 CRUD 서비스 팩토리 패턴을 구현하여 보일러플레이트를 최소화했습니다.

**핵심 구현: `createCrudService` 팩토리**

```typescript
// src/lib/api/services/create-crud-service.ts
export function createCrudService<T, TCreate = T, TUpdate = TCreate>(
  handlers: {
    list: (params?: PaginationParams & FilterParams) => Promise<ListResponse<T>>
    get: (id: string) => Promise<T>
    create: (data: TCreate) => Promise<T>
    update: (id: string, data: Partial<TUpdate>) => Promise<T>
    delete: (id: string) => Promise<void>
  },
  config?: ServiceConfig
): CrudService<T, TCreate, TUpdate>
```

**실제 사용 예시:**

```typescript
// src/lib/api/services/clouds.ts
export const cloudService = createCrudService<
  Cloud,
  CloudCreateRequest,
  CloudUpdateRequest
>({
  list: async (params) => {
    // API 호출 로직
  },
  create: async (data) => {
    // API 호출 로직
  },
  // ... 기타 CRUD 메서드
})
```

**장점:**
- ✅ 새로운 리소스 추가 시 타입만 정의하면 즉시 CRUD API 생성
- ✅ 일관된 에러 핸들링 및 응답 포맷
- ✅ 딜레이, 로깅 등 공통 기능 중앙 관리

#### 1.3 React Query 통합 레이어 (Query Hooks)

**Query Key Factory 패턴**

쿼리 키를 체계적으로 관리하여 캐시 무효화를 정밀하게 제어합니다.

```typescript
// src/lib/query-keys/factory.ts
export function createQueryKeys<TEntity extends string>(entity: TEntity) {
  return {
    all: [entity] as const,                           // ['clouds']
    lists: () => [entity, 'list'] as const,           // ['clouds', 'list']
    list: (filters) => [entity, 'list', filters],     // ['clouds', 'list', {...}]
    details: () => [entity, 'detail'] as const,       // ['clouds', 'detail']
    detail: (id) => [entity, 'detail', id],           // ['clouds', 'detail', '123']
  }
}

// src/lib/query-keys/clouds.keys.ts
export const cloudKeys = createQueryKeys('clouds')
```

**재사용 가능한 CRUD 훅**

`useList`, `useCreate`, `useUpdate`, `useDelete` 등 제네릭 훅을 구현하여 낙관적 업데이트, 에러 핸들링, 토스트 알림을 자동화했습니다.

```typescript
// src/hooks/queries/use-crud-queries.ts
export function useCreate<T, TCreate>(
  invalidateKey: QueryKey,
  mutationFn: (data: TCreate) => Promise<T>,
  options?: {
    translationKey?: string
    onOptimisticUpdate?: (data: TCreate) => Partial<T>
  }
) {
  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // 낙관적 업데이트 로직
      await queryClient.cancelQueries({ queryKey: invalidateKey })
      const previousData = queryClient.getQueriesData({ queryKey: invalidateKey })

      if (options?.onOptimisticUpdate) {
        queryClient.setQueriesData<ListResponse<T>>(
          { queryKey: invalidateKey },
          (old) => ({
            ...old,
            items: [optimisticItem, ...old.items],
            total: old.total + 1,
          })
        )
      }
      return { previousData }
    },
    onError: (error, variables, context) => {
      // 롤백 + 에러 토스트
    },
    onSuccess: (data) => {
      // 성공 토스트
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
    },
  })
}
```

**최종 사용 레이어 (Feature Hooks)**

```typescript
// src/features/clouds/hooks/use-cloud-queries.ts
export function useCloudList(params?: PaginationParams & FilterParams) {
  return useList<Cloud>(
    cloudKeys.list(params),
    () => cloudService.list(params)
  )
}

export function useCreateCloud() {
  return useCreate<Cloud, CloudCreateRequest>(
    cloudKeys.lists(),
    cloudService.create,
    {
      translationKey: 'cloud.messages',
      onOptimisticUpdate: (newCloud) => ({ ...newCloud }),
    }
  )
}
```

**컴포넌트에서의 사용:**

```typescript
function CloudTable() {
  const { data, isLoading, error } = useCloudList()
  const createMutation = useCreateCloud()

  const handleCreate = (data: CloudCreateRequest) => {
    createMutation.mutate(data)
    // 낙관적 업데이트, 에러 핸들링, 토스트 알림 자동 처리
  }
}
```

**실무 관점의 전체 흐름:**

```
1. API 문서 확인
   └─> OpenAPI/Swagger 스펙 검토

2. 타입 정의 (types.ts)
   └─> interface Cloud, CloudCreateRequest 등 생성

3. 서비스 생성 (clouds.ts)
   └─> createCrudService로 API 클라이언트 생성

4. Query Key 정의 (clouds.keys.ts)
   └─> createQueryKeys('clouds')

5. 훅 구성 (use-cloud-queries.ts)
   └─> useList, useCreate 등 재사용 훅 활용

6. 컴포넌트 통합
   └─> 3줄 코드로 완전한 CRUD 구현
```

**확장성:**

새로운 리소스(예: Users) 추가 시:

```typescript
// 1. 타입 정의 (30초)
interface User { id: string; name: string; email: string }

// 2. 서비스 생성 (1분)
export const userService = createCrudService<User>({ ... })

// 3. Query Key (10초)
export const userKeys = createQueryKeys('users')

// 4. 훅 생성 (1분)
export const useUserList = () => useList(userKeys.lists(), userService.list)

// 총 소요 시간: ~3분 (기존 방식 대비 10배 이상 빠름)
```

---

### 2. 다국어(i18n) 관리 시스템

#### 2.1 구조화된 번역 파일 관리

```
messages/
├── common/
│   ├── en.json (공통 UI 텍스트)
│   ├── ko.json
│   └── ja.json
├── cloud/
│   ├── en.json (도메인별 분리)
│   ├── ko.json
│   └── ja.json
└── [feature]/
    └── ...
```

**네임스페이스 기반 번역:**

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'

export default async function LocaleLayout({ children, params: { locale } }) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
```

#### 2.2 타입 안전 번역 시스템

**자동 타입 생성:**

```typescript
// next-intl.d.ts (자동 생성)
import 'next-intl'

type Messages = typeof import('./messages/en.json')

declare global {
  interface IntlMessages extends Messages {}
}
```

**컴포넌트에서 사용:**

```typescript
import { useTranslations } from 'next-intl'

function CloudForm() {
  const t = useTranslations('cloud')
  const tCommon = useTranslations('common')

  return (
    <div>
      <h1>{t('title')}</h1>
      <Button>{tCommon('save')}</Button>
    </div>
  )
  // 타입 자동완성 및 컴파일 타임 검증 지원
}
```

#### 2.3 동적 필드 번역 유틸리티

유효성 검사 에러 메시지에서 필드명을 동적으로 번역하는 문제를 해결했습니다.

```typescript
// src/lib/i18n/translate-fields.ts
export function translateFieldNames(
  fields: string[],
  translationMap: Record<string, string> | undefined,
  translate: (key: string) => string
): string {
  return fields
    .map(field => {
      const translationKey = translationMap?.[field]
      if (translationKey) {
        try {
          return translate(translationKey)
        } catch {
          return field // fallback
        }
      }
      return field
    })
    .join(', ')
}
```

**실제 사용 예시:**

```typescript
// src/lib/validation/step-validation.ts
const translationMap = {
  regionList: 'regions',
  name: 'name',
  cloudGroupName: 'cloudGroup',
}

const translatedFields = translateFieldNames(
  missingFields,
  translationMap,
  t
)

toast.error(tCommon('validationError', { fields: translatedFields }))
// 한국어: "필수 항목을 입력해주세요: 리전, 이름, 클라우드 그룹"
// 영어: "Please fill in required fields: Regions, Name, Cloud Group"
```

#### 2.4 i18n 라우팅 및 미들웨어

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'ko', 'ja'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed', // /ko/clouds 대신 /clouds (기본 로케일)
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

**URL 구조:**
```
/clouds         → 한국어 (기본)
/en/clouds      → 영어
/ja/clouds      → 일본어
```

**어려움과 해결 방안:**

1. **문제**: 서버/클라이언트 컴포넌트 간 번역 데이터 공유
   - **해결**: `NextIntlClientProvider`로 서버에서 메시지를 가져와 클라이언트 전달

2. **문제**: 동적 콘텐츠(유효성 검사 에러) 번역
   - **해결**: `translationMap` + `translateFieldNames` 유틸리티 구현

3. **문제**: 번역 파일 누락/오타 방지
   - **해결**: TypeScript 타입 생성으로 컴파일 타임 검증

4. **문제**: 복수형 처리 (예: "1개 항목" vs "2개 항목")
   - **해결**: ICU MessageFormat 활용
     ```json
     {
       "totalItems": "{count, plural, =0 {항목 없음} other {총 #개 항목}}"
     }
     ```

---

### 3. UX 최적화 및 추가 개발 기능

#### 3.1 글로벌 로딩 인디케이터

TanStack Query의 `useIsFetching`, `useIsMutating` 훅을 활용한 전역 로딩 상태 표시

```typescript
// src/components/loading/global-loading.tsx
export function GlobalLoading() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const isLoading = isFetching > 0 || isMutating > 0

  if (!isLoading) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Loader2 className="animate-spin" />
      <span>Loading...</span>
    </div>
  )
}
```

**장점:**
- 모든 쿼리/뮤테이션에 대해 자동으로 로딩 표시
- 개별 컴포넌트에서 로딩 상태 관리 불필요

#### 3.2 스켈레톤 UI

콘텐츠 로딩 시 레이아웃 시프트(CLS) 방지 및 사용자 경험 향상

```typescript
// src/components/loading/table-skeleton.tsx
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

**사용:**
```typescript
function CloudTable() {
  const { data, isLoading } = useCloudList()

  if (isLoading) return <TableSkeleton rows={10} columns={5} />

  return <DataTable data={data.items} columns={columns} />
}
```

#### 3.3 낙관적 업데이트 (Optimistic Updates)

사용자 액션에 대한 즉각적인 UI 반영으로 체감 속도 향상

```typescript
// src/hooks/queries/use-crud-queries.ts - useCreate 내부
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: invalidateKey })

  const previousData = queryClient.getQueriesData({ queryKey: invalidateKey })

  // 즉시 UI 업데이트
  queryClient.setQueriesData<ListResponse<T>>(
    { queryKey: invalidateKey },
    (old) => ({
      ...old,
      items: [optimisticItem, ...old.items],
      total: old.total + 1,
    })
  )

  return { previousData }
},
onError: (error, variables, context) => {
  // 실패 시 롤백
  context?.previousData.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data)
  })
}
```

#### 3.4 단계별 마법사 (Step Wizard)

복잡한 폼을 단계별로 분리하여 인지 부하 감소

```typescript
// src/components/ui/step-wizard.tsx
export function StepWizard({ totalSteps, onStepChange }: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <StepWizardContext.Provider value={{ currentStep, goToNext, goToPrevious }}>
      <StepIndicator steps={steps} />
      {children}
    </StepWizardContext.Provider>
  )
}

// src/components/cloud-form/cloud-form-wizard.tsx
<StepWizard totalSteps={4}>
  <StepContent step={0}><BasicInfoStep /></StepContent>
  <StepContent step={1}><CredentialsStep /></StepContent>
  <StepContent step={2}><RegionsStep /></StepContent>
  <StepContent step={3}><FeaturesStep /></StepContent>
</StepWizard>
```

**특징:**
- 각 단계별 독립적인 검증
- 진행 상황 시각화 (StepIndicator)
- 모바일 최적화된 반응형 디자인

#### 3.5 에러 경계 (Error Boundary)

런타임 에러를 우아하게 처리하여 앱 전체 크래시 방지

```typescript
// src/components/error/error-boundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // 에러 로깅 서비스 전송 (예: Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
```

#### 3.6 토스트 알림 시스템

사용자 액션에 대한 즉각적인 피드백 제공 (Sonner 라이브러리 활용)

```typescript
import { toast } from 'sonner'

// 성공
toast.success('Cloud created successfully', {
  description: `${data.name} has been added`,
})

// 에러
toast.error('Failed to create cloud', {
  description: error.message,
})

// 프로미스 기반 로딩
toast.promise(
  createCloud(data),
  {
    loading: 'Creating cloud...',
    success: 'Cloud created!',
    error: 'Failed to create cloud',
  }
)
```

#### 3.7 반응형 테이블 (Responsive Table)

TanStack Table을 활용한 고급 데이터 테이블 기능

```typescript
// src/features/clouds/components/cloud-table/cloud-table.tsx
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onRowSelectionChange: setRowSelection,
})
```

**기능:**
- 정렬, 필터링, 페이지네이션
- 행 선택 (다중 선택 지원)
- 열 표시/숨김 토글
- 모바일에서 카드 형태로 변환

#### 3.8 폼 상태 관리 및 변경 감지

사용자가 수정 중인 데이터를 실수로 잃지 않도록 보호

```typescript
// src/components/cloud-form/cloud-form-wizard.tsx
const form = useForm()
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

useEffect(() => {
  const subscription = form.watch(() => {
    setHasUnsavedChanges(true)
  })
  return () => subscription.unsubscribe()
}, [form.watch])

const handleClose = () => {
  if (hasUnsavedChanges) {
    toast.error('Unsaved Changes', {
      description: 'Your changes will be lost',
      action: {
        label: 'Continue Editing',
        onClick: () => {},
      },
    })
  } else {
    onClose()
  }
}
```

---

## 📂 프로젝트 구조

```
src/
├── app/
│   └── [locale]/              # 국제화 라우팅
│       ├── layout.tsx
│       └── page.tsx
├── components/
│   ├── ui/                    # shadcn/ui 컴포넌트
│   ├── cloud-form/            # 클라우드 폼 관련 컴포넌트
│   ├── loading/               # 로딩 UI 컴포넌트
│   └── error/                 # 에러 처리 컴포넌트
├── features/
│   └── clouds/                # 클라우드 기능 모듈
│       ├── components/
│       ├── hooks/             # 커스텀 훅
│       ├── config/            # 설정 파일
│       └── utils/
├── hooks/
│   └── queries/               # 재사용 가능한 React Query 훅
├── lib/
│   ├── api/
│   │   ├── services/          # API 서비스 레이어
│   │   └── types.ts           # API 타입 정의
│   ├── query-keys/            # Query Key Factory
│   ├── i18n/                  # 국제화 유틸리티
│   └── utils/                 # 유틸리티 함수
├── types/                     # 전역 타입 정의
├── i18n/                      # next-intl 설정
└── middleware.ts              # Next.js 미들웨어
```

---

## 🛠️ 시작하기

### 설치

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 린트 검사
pnpm lint

# E2E 테스트
pnpm test:e2e
```

### 환경 변수

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DEFAULT_LOCALE=ko
```

---

## 🧪 테스트

Playwright를 활용한 E2E 테스트 구성

```typescript
// e2e/cloud-form.spec.ts
test('should create a new cloud', async ({ page }) => {
  await page.goto('/clouds')
  await page.click('text=Create Cloud')

  await page.fill('input[name="name"]', 'Test Cloud')
  await page.selectOption('select[name="provider"]', 'aws')
  await page.click('text=Next')

  // ... 단계별 입력

  await page.click('text=Create')
  await expect(page.locator('text=Cloud created successfully')).toBeVisible()
})
```

---

## 📝 코드 품질

- **ESLint**: 엄격한 린트 규칙 적용
- **Prettier**: 일관된 코드 포맷팅
- **TypeScript Strict Mode**: 타입 안전성 최대화
- **Import Sorting**: 자동 import 정렬

---

## 🌟 주요 패턴 및 베스트 프랙티스

1. **Query Key Factory**: 쿼리 키 중앙 관리로 캐시 일관성 보장
2. **Generic CRUD Hooks**: 재사용 가능한 훅으로 코드 중복 제거
3. **Optimistic Updates**: 사용자 경험 향상을 위한 낙관적 업데이트
4. **Feature-based Architecture**: 도메인별 폴더 구조로 확장성 확보
5. **Type-safe i18n**: 번역 키 타입 검증으로 런타임 에러 방지
6. **Compound Components**: Step Wizard 등 유연한 컴포넌트 구성
