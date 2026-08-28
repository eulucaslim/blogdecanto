import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilePenLine,
  ImagePlus,
  LoaderCircle,
  LogIn,
  Menu,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"

import { Button } from "@workspace/ui/components/button"

type PostStatus = "draft" | "published"

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: PostStatus
  coverImage?: string
  coverImageKey?: string
  createdAt: string
  updatedAt?: string
}

type PostDraft = Omit<Post, "id" | "createdAt" | "updatedAt">

type UserProfile = {
  id: string
  username?: string
  email?: string
  avatarUrl?: string | null
  picture?: string | null
  role?: string
}

type UploadResponse = {
  uploadUrl?: string
  url?: string
  publicUrl?: string
  fileUrl?: string
  key?: string
  objectKey?: string
  coverImageKey?: string
}

const API_PATHS = {
  publicPosts: "/posts",
  adminPosts: "/admin/posts",
  profile: "/api/admin/profile",
  presignUpload: "/admin/uploads/presign",
  uploadedUrl: "/admin/uploads/url",
  session: "/auth/session",
  googleLogin: "/auth/google",
} as const

const AUTOSAVE_STORAGE_KEY = "canto-notes:post-draft"

const starterPosts: Post[] = [
  {
    id: "local-1",
    title: "A slower way to make things",
    slug: "a-slower-way-to-make-things",
    excerpt:
      "Notes on attention, creative momentum, and choosing a pace that leaves room for the good ideas.",
    content:
      "The internet rewards speed. Making something worth keeping usually asks for something else: attention, patience, and the courage to leave a little white space.",
    status: "published",
    coverImage:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85",
    createdAt: "2026-02-18T10:00:00.000Z",
  },
  {
    id: "local-2",
    title: "The tiny rituals behind a clear desk",
    slug: "the-tiny-rituals-behind-a-clear-desk",
    excerpt:
      "A practical field guide to resetting your workspace and making the next hour feel possible.",
    content:
      "Before I start, I put three things back where they belong. This small reset is less about tidiness and more about telling my brain that the work has somewhere to land.",
    status: "published",
    coverImage:
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=85",
    createdAt: "2026-01-29T10:00:00.000Z",
  },
  {
    id: "local-3",
    title: "On collecting better questions",
    slug: "on-collecting-better-questions",
    excerpt:
      "Why a notebook full of honest questions can be more useful than a folder full of answers.",
    content:
      "Questions are a gentle way to keep moving. They make a little room for surprise, which is often where the useful work begins.",
    status: "draft",
    createdAt: "2026-01-12T10:00:00.000Z",
  },
]

const emptyDraft: PostDraft = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "draft",
  coverImage: "",
  coverImageKey: "",
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(date),
  )

const readingTime = (content: string) => `${Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))} min read`

const normalizePosts = (value: unknown): Post[] => {
  const posts = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && "posts" in value
      ? (value as { posts?: unknown }).posts
      : typeof value === "object" && value !== null && "data" in value
        ? (value as { data?: unknown }).data
        : undefined

  if (!Array.isArray(posts)) return []
  return posts.flatMap((post): Post[] => {
    if (typeof post !== "object" || post === null) return []
    const candidate = post as Record<string, unknown>
    if (typeof candidate.id !== "string" || typeof candidate.title !== "string") return []
    return [{
      id: candidate.id,
      title: candidate.title,
      slug: typeof candidate.slug === "string" ? candidate.slug : "",
      excerpt: typeof candidate.excerpt === "string" ? candidate.excerpt : "",
      content: typeof candidate.content === "string" ? candidate.content : "",
      status: candidate.status === "PUBLISHED" || candidate.status === "published" ? "published" : "draft",
      coverImage:
        typeof candidate.coverImage === "string"
          ? candidate.coverImage
          : typeof candidate.coverImageUrl === "string"
            ? candidate.coverImageUrl
            : typeof candidate.imageUrl === "string"
              ? candidate.imageUrl
              : typeof candidate.coverImageKey === "string" && candidate.coverImageKey.startsWith("http")
                ? candidate.coverImageKey
            : undefined,
      coverImageKey: typeof candidate.coverImageKey === "string" ? candidate.coverImageKey : undefined,
      createdAt:
        typeof candidate.createdAt === "string"
          ? candidate.createdAt
          : typeof candidate.publishedAt === "string"
            ? candidate.publishedAt
            : new Date().toISOString(),
      updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : undefined,
    }]
  })
}

const apiMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again."

type StoredPostDraft = {
  draft: PostDraft
  selectedPostId: string | null
  savedAt: string
}

const parseStoredPostDraft = (value: string): StoredPostDraft | null => {
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== "object" || parsed === null) return null
    const candidate = parsed as Record<string, unknown>
    const storedDraft = candidate.draft
    if (typeof storedDraft !== "object" || storedDraft === null) return null
    const draftCandidate = storedDraft as Record<string, unknown>
    if (
      typeof draftCandidate.title !== "string" ||
      typeof draftCandidate.slug !== "string" ||
      typeof draftCandidate.excerpt !== "string" ||
      typeof draftCandidate.content !== "string" ||
      (draftCandidate.status !== "draft" && draftCandidate.status !== "published")
    ) {
      return null
    }
    if (typeof candidate.savedAt !== "string" || Number.isNaN(Date.parse(candidate.savedAt))) return null
    return {
      draft: {
        title: draftCandidate.title,
        slug: draftCandidate.slug,
        excerpt: draftCandidate.excerpt,
        content: draftCandidate.content,
        status: draftCandidate.status,
        coverImage: typeof draftCandidate.coverImage === "string" ? draftCandidate.coverImage : "",
        coverImageKey: typeof draftCandidate.coverImageKey === "string" ? draftCandidate.coverImageKey : "",
      },
      selectedPostId: typeof candidate.selectedPostId === "string" ? candidate.selectedPostId : null,
      savedAt: candidate.savedAt,
    }
  } catch {
    return null
  }
}

const formatSavedTime = (date: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(date))

const isSafeMarkdownHref = (href: string) => {
  const value = href.trim()
  return /^(https?:\/\/|mailto:|#)/i.test(value) || (value.startsWith("/") && !value.startsWith("//"))
}

const renderInlineMarkdown = (value: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  const pattern =
    /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) {
      nodes.push(<span key={`text-${nodes.length}`}>{value.slice(cursor, match.index)}</span>)
    }
    const [, token, linkText, linkHref, code, boldA, boldB, italicA, italicB] = match
    if (linkText && linkHref && isSafeMarkdownHref(linkHref)) {
      nodes.push(
        <a
          className="font-medium text-[#718b32] underline decoration-[#b4cc5c] underline-offset-4"
          href={linkHref}
          key={`link-${nodes.length}`}
          rel={linkHref.startsWith("http") ? "noreferrer" : undefined}
          target={linkHref.startsWith("http") ? "_blank" : undefined}
        >
          {linkText}
        </a>,
      )
    } else if (code) {
      nodes.push(
        <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[0.9em] dark:bg-white/10" key={`code-${nodes.length}`}>
          {code}
        </code>,
      )
    } else if (boldA || boldB) {
      nodes.push(<strong key={`bold-${nodes.length}`}>{boldA ?? boldB}</strong>)
    } else if (italicA || italicB) {
      nodes.push(<em key={`italic-${nodes.length}`}>{italicA ?? italicB}</em>)
    } else {
      nodes.push(<span key={`text-${nodes.length}`}>{token}</span>)
    }
    cursor = match.index + match[0].length
  }

  if (cursor < value.length) {
    nodes.push(<span key={`text-${nodes.length}`}>{value.slice(cursor)}</span>)
  }
  return nodes
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push(
      <p className="leading-8" key={`paragraph-${blocks.length}`}>
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>,
    )
    paragraph = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (!line.trim()) {
      flushParagraph()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      const level = heading[1].length
      const Heading = level === 1 ? "h1" : level === 2 ? "h2" : "h3"
      blocks.push(
        <Heading className="font-semibold tracking-tight" key={`heading-${blocks.length}`}>
          {renderInlineMarkdown(heading[2])}
        </Heading>,
      )
      continue
    }

    const unorderedItem = line.match(/^\s*[-*]\s+(.+)$/)
    if (unorderedItem) {
      flushParagraph()
      const items: string[] = [unorderedItem[1]]
      while (index + 1 < lines.length) {
        const nextItem = lines[index + 1]?.match(/^\s*[-*]\s+(.+)$/)
        if (!nextItem) break
        items.push(nextItem[1])
        index += 1
      }
      blocks.push(
        <ul className="list-disc space-y-2 pl-6" key={`unordered-${blocks.length}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    const orderedItem = line.match(/^\s*\d+\.\s+(.+)$/)
    if (orderedItem) {
      flushParagraph()
      const items: string[] = [orderedItem[1]]
      while (index + 1 < lines.length) {
        const nextItem = lines[index + 1]?.match(/^\s*\d+\.\s+(.+)$/)
        if (!nextItem) break
        items.push(nextItem[1])
        index += 1
      }
      blocks.push(
        <ol className="list-decimal space-y-2 pl-6" key={`ordered-${blocks.length}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    const quote = line.match(/^>\s?(.+)$/)
    if (quote) {
      flushParagraph()
      blocks.push(
        <blockquote className="border-l-2 border-[#b4cc5c] pl-4 italic text-[#687069] dark:text-[#aab2aa]" key={`quote-${blocks.length}`}>
          {renderInlineMarkdown(quote[1])}
        </blockquote>,
      )
      continue
    }

    paragraph.push(line.trim())
  }
  flushParagraph()

  return blocks.length > 0 ? <div className="space-y-5">{blocks}</div> : <p className="text-[#7b847d]">Nothing to preview yet.</p>
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const body = await response.text()
  let parsed: unknown = undefined
  if (body) {
    try {
      parsed = JSON.parse(body) as unknown
    } catch {
      parsed = undefined
    }
  }
  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as { message: unknown }).message)
        : `Request failed (${response.status})`
    throw new Error(message)
  }
  return parsed as T
}

async function resolveUploadedUrl(key: string): Promise<string> {
  const result = await requestJson<{ url?: string; publicUrl?: string; fileUrl?: string }>(
    `${API_PATHS.uploadedUrl}?key=${encodeURIComponent(key)}`,
  )
  const url = result.url ?? result.publicUrl ?? result.fileUrl
  if (!url) throw new Error("The upload service did not return an image URL.")
  return url
}

function StatusPill({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
        status === "published"
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
      }`}
    >
      <span className={`size-1.5 rounded-full ${status === "published" ? "bg-emerald-500" : "bg-amber-500"}`} />
      {status}
    </span>
  )
}

function App() {
  const [posts, setPosts] = useState<Post[]>(starterPosts)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PostDraft>(emptyDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileUrlDraft, setProfileUrlDraft] = useState("")
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isProfileUploading, setIsProfileUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profileFileInputRef = useRef<HTMLInputElement>(null)
  const [publicPostId, setPublicPostId] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write")
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "recovered">("idle")
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null)
  const [autosaveHydrated, setAutosaveHydrated] = useState(false)
  const [isDraftDirty, setIsDraftDirty] = useState(false)

  const switchToAdmin = () => {
    setIsLoading(true)
    setIsAdmin(true)
    setMenuOpen(false)
  }

  const switchToBlog = () => {
    setIsLoading(true)
    setIsAdmin(false)
  }

  useEffect(() => {
    let cancelled = false
    const endpoint = isAdmin ? API_PATHS.adminPosts : API_PATHS.publicPosts

    requestJson<unknown>(endpoint)
      .then((result) => {
        if (cancelled) return
        const remotePosts = normalizePosts(result)
        if (remotePosts.length > 0) {
          setPosts(remotePosts)
          setStatusMessage("Synced with the blog API.")
        } else {
          setStatusMessage("API returned no posts. Showing your local workspace.")
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setErrorMessage(`Could not reach ${endpoint}: ${apiMessage(error)}`)
        setStatusMessage("Offline mode: changes stay in this browser until the API is available.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    if (isAdmin) {
      requestJson<UserProfile>(API_PATHS.session)
        .then((session) => {
          if (cancelled) return
          setProfile(session)
          setProfileUrlDraft(session.avatarUrl ?? session.picture ?? "")
        })
        .catch(() => {
          if (!cancelled) {
            setProfile(null)
            setProfileUrlDraft("")
          }
        })
    }

    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!isAdmin) {
        setAutosaveHydrated(false)
        return
      }

      try {
        const stored = localStorage.getItem(AUTOSAVE_STORAGE_KEY)
        const recovered = stored ? parseStoredPostDraft(stored) : null
        if (recovered) {
          setDraft(recovered.draft)
          setSelectedPostId(recovered.selectedPostId)
          setAutosavedAt(recovered.savedAt)
          setAutosaveStatus("recovered")
          setIsDraftDirty(true)
        } else {
          setAutosavedAt(null)
          setAutosaveStatus("idle")
          setIsDraftDirty(false)
        }
      } catch {
        setAutosavedAt(null)
        setAutosaveStatus("idle")
      } finally {
        setAutosaveHydrated(true)
      }
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin || !autosaveHydrated || !isDraftDirty) return

    const timeout = window.setTimeout(() => {
      const hasDraftContent = Boolean(
        draft.title.trim() ||
          draft.slug.trim() ||
          draft.excerpt.trim() ||
          draft.content.trim() ||
          draft.coverImage ||
          draft.coverImageKey,
      )
      if (!hasDraftContent) {
        try {
          localStorage.removeItem(AUTOSAVE_STORAGE_KEY)
        } catch {
          // Local storage can be unavailable in private browsing contexts.
        }
        setAutosavedAt(null)
        setAutosaveStatus("idle")
        return
      }

      setAutosaveStatus("saving")
      const savedAt = new Date().toISOString()
      try {
        const stored: StoredPostDraft = { draft, selectedPostId, savedAt }
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(stored))
        setAutosavedAt(savedAt)
        setAutosaveStatus("saved")
      } catch {
        setAutosaveStatus("idle")
      }
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [autosaveHydrated, draft, isAdmin, isDraftDirty, selectedPostId])

  const publishedPosts = useMemo(
    () => posts.filter((post) => post.status === "published"),
    [posts],
  )
  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return posts
    return posts.filter((post) =>
      [post.title, post.excerpt, post.slug].some((field) => field.toLowerCase().includes(query)),
    )
  }, [posts, search])
  const featuredPost = publishedPosts[0]
  const selectedPublicPost = publicPostId
    ? publishedPosts.find((post) => post.id === publicPostId) ?? null
    : null

  const profileName = profile?.username ?? profile?.email ?? "Admin"
  const profileImage = profile?.avatarUrl ?? profile?.picture ?? profileUrlDraft
  const profileInitials = profileName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  const saveProfileUrl = async (url = profileUrlDraft.trim()) => {
    if (!url) {
      setErrorMessage("Add a profile image URL before saving.")
      return
    }
    setIsProfileSaving(true)
    setErrorMessage("")
    try {
      const response = await requestJson<UserProfile>(API_PATHS.profile, {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: url }),
      })
      const nextProfile = response ?? { ...(profile ?? { id: "current-user" }), avatarUrl: url }
      setProfile(nextProfile)
      setProfileUrlDraft(nextProfile.avatarUrl ?? nextProfile.picture ?? url)
      setStatusMessage("Profile image saved.")
    } catch (error: unknown) {
      setErrorMessage(
        `Profile image could not be saved: ${apiMessage(error)}. Your backend may not expose PATCH ${API_PATHS.profile} yet.`,
      )
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleProfileImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setIsProfileUploading(true)
    setErrorMessage("")
    setStatusMessage("Preparing profile image upload…")
    try {
      const presign = await requestJson<UploadResponse>(API_PATHS.presignUpload, {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          purpose: "profile",
        }),
      })
      const uploadUrl = presign.uploadUrl ?? presign.url
      const objectKey = presign.key ?? presign.objectKey ?? presign.coverImageKey
      if (!uploadUrl || !objectKey) {
        throw new Error("The upload service did not return a profile upload target.")
      }
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!upload.ok) throw new Error(`Image upload failed (${upload.status}).`)
      const publicUrl = await resolveUploadedUrl(objectKey)
      setProfileUrlDraft(publicUrl)
      await saveProfileUrl(publicUrl)
    } catch (error: unknown) {
      setErrorMessage(
        `Profile image upload is unavailable: ${apiMessage(error)}. Add an image URL instead, or implement the profile upload contract.`,
      )
      setStatusMessage("Your account and post editor are still available.")
    } finally {
      setIsProfileUploading(false)
    }
  }

  const selectPost = (post: Post) => {
    try {
      localStorage.removeItem(AUTOSAVE_STORAGE_KEY)
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
    setSelectedPostId(post.id)
    setEditorMode("write")
    setIsDraftDirty(false)
    setAutosavedAt(null)
    setAutosaveStatus("idle")
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      coverImage: post.coverImage ?? "",
      coverImageKey: post.coverImageKey ?? "",
    })
    setErrorMessage("")
    setStatusMessage("")
  }

  const startNewPost = () => {
    try {
      localStorage.removeItem(AUTOSAVE_STORAGE_KEY)
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
    setSelectedPostId(null)
    setEditorMode("write")
    setIsDraftDirty(false)
    setAutosavedAt(null)
    setAutosaveStatus("idle")
    setDraft(emptyDraft)
    setErrorMessage("")
    setStatusMessage("")
  }

  const updateDraft = (field: keyof PostDraft, value: string | PostStatus) => {
    setIsDraftDirty(true)
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.slug.trim() || !draft.content.trim()) {
      setErrorMessage("Add a title, slug, and some content before saving.")
      return
    }

    const localId = selectedPostId ?? `local-${Date.now()}`
    const nextPost: Post = {
      ...draft,
      id: localId,
      title: draft.title.trim(),
      slug: draft.slug.trim().replace(/\s+/g, "-").toLowerCase(),
      createdAt: selectedPostId
        ? posts.find((post) => post.id === selectedPostId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setIsSaving(true)
    setErrorMessage("")
    setStatusMessage("")
    try {
      const endpoint = selectedPostId
        ? `${API_PATHS.adminPosts}/${selectedPostId}`
        : API_PATHS.adminPosts
      const response = await requestJson<unknown>(endpoint, {
        method: selectedPostId ? "PATCH" : "POST",
        body: JSON.stringify({
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt,
          content: draft.content,
          status: draft.status === "published" ? "PUBLISHED" : "DRAFT",
          ...(draft.coverImageKey ? { coverImageKey: draft.coverImageKey } : {}),
        }),
      })
      const remotePost = normalizePosts([response])[0] ?? nextPost
      setPosts((current) =>
        selectedPostId
          ? current.map((post) => (post.id === selectedPostId ? remotePost : post))
          : [remotePost, ...current],
      )
      setSelectedPostId(remotePost.id)
      setDraft({
        title: remotePost.title,
        slug: remotePost.slug,
        excerpt: remotePost.excerpt,
        content: remotePost.content,
        status: remotePost.status,
        coverImage: remotePost.coverImage ?? "",
        coverImageKey: remotePost.coverImageKey ?? "",
      })
      setIsDraftDirty(false)
      try {
        localStorage.removeItem(AUTOSAVE_STORAGE_KEY)
      } catch {
        // Local storage can be unavailable in private browsing contexts.
      }
      setAutosavedAt(null)
      setAutosaveStatus("idle")
      setStatusMessage("Saved to the blog API.")
    } catch (error: unknown) {
      setPosts((current) =>
        selectedPostId
          ? current.map((post) => (post.id === selectedPostId ? nextPost : post))
          : [nextPost, ...current],
      )
      setSelectedPostId(localId)
      const savedAt = new Date().toISOString()
      try {
        const stored: StoredPostDraft = { draft, selectedPostId: localId, savedAt }
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(stored))
        setAutosavedAt(savedAt)
        setAutosaveStatus("saved")
      } catch {
        setAutosaveStatus("idle")
      }
      setStatusMessage("Saved locally — the API is unavailable, so this change is only in this session.")
      setErrorMessage(`API save failed: ${apiMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPostId) {
      setDraft(emptyDraft)
      return
    }
    const post = posts.find((item) => item.id === selectedPostId)
    if (!post || !window.confirm(`Delete “${post.title}”?`)) return

    setIsDeleting(true)
    setErrorMessage("")
    try {
      await requestJson(`${API_PATHS.adminPosts}/${selectedPostId}`, { method: "DELETE" })
      setPosts((current) => current.filter((item) => item.id !== selectedPostId))
      startNewPost()
      setStatusMessage("Post deleted from the blog API.")
    } catch (error: unknown) {
      if (selectedPostId.startsWith("local-")) {
        setPosts((current) => current.filter((item) => item.id !== selectedPostId))
        startNewPost()
        setStatusMessage("Deleted local draft.")
        setErrorMessage(`API delete failed: ${apiMessage(error)}`)
      } else {
        setErrorMessage(`Could not delete post: ${apiMessage(error)}`)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setIsUploading(true)
    setErrorMessage("")
    setStatusMessage("Preparing secure image upload…")
    try {
      const presign = await requestJson<UploadResponse>(API_PATHS.presignUpload, {
        method: "POST",
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      })
      const uploadUrl = presign.uploadUrl ?? presign.url
      const objectKey = presign.key ?? presign.objectKey ?? presign.coverImageKey
      if (!uploadUrl || !objectKey) throw new Error("The upload service did not return an upload target.")

      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!upload.ok) throw new Error(`Image upload failed (${upload.status}).`)
      const publicUrl = await resolveUploadedUrl(objectKey)
      updateDraft("coverImage", publicUrl)
      setDraft((current) => ({
        ...current,
        coverImageKey: objectKey,
      }))
      setStatusMessage("Cover image uploaded. Save the post to keep it.")
    } catch (error: unknown) {
      setErrorMessage(`Could not upload cover image: ${apiMessage(error)}`)
      setStatusMessage("The rest of the editor is still available.")
    } finally {
      setIsUploading(false)
    }
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#f7f7f4] text-[#1d211e] dark:bg-[#101311] dark:text-[#f1f3ee]">
        <header className="border-b border-black/8 bg-[#f7f7f4]/90 backdrop-blur dark:border-white/10 dark:bg-[#101311]/90">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
            <button className="flex items-center gap-3" onClick={switchToBlog} type="button">
              <span className="grid size-9 place-items-center rounded-xl bg-[#d9f06a] text-[#253014]">
                <Sparkles size={18} strokeWidth={2.5} />
              </span>
              <span className="text-left">
                <span className="block font-semibold tracking-tight">Canto Notes</span>
                <span className="block text-xs text-[#687069] dark:text-[#aab2aa]">Publishing studio</span>
              </span>
            </button>
            <div className="flex items-center gap-2">
              <nav
                aria-label="Workspace navigation"
                className="hidden items-center gap-1 rounded-xl border border-black/8 bg-white/70 p-1 text-xs dark:border-white/10 dark:bg-white/5 sm:flex"
              >
                <button
                  className="rounded-lg px-3 py-1.5 text-[#687069] transition hover:bg-black/[0.04] dark:text-[#aab2aa] dark:hover:bg-white/5"
                  onClick={switchToBlog}
                  type="button"
                >
                  Public blog
                </button>
                <span
                  aria-current="page"
                  className="rounded-lg bg-[#eff7d8] px-3 py-1.5 font-semibold text-[#536c21] dark:bg-[#b4cc5c]/15 dark:text-[#d9f06a]"
                >
                  Admin studio
                </span>
              </nav>
              <div className="hidden items-center gap-2 pr-1 sm:flex">
                {profileImage ? (
                  <img alt={`${profileName} profile`} className="size-9 rounded-full object-cover ring-2 ring-white dark:ring-white/10" src={profileImage} />
                ) : (
                  <span className="grid size-9 place-items-center rounded-full bg-[#dfe8c2] text-xs font-semibold text-[#53652b] dark:bg-[#b4cc5c]/20 dark:text-[#d9f06a]">
                    {profileInitials || <UserRound size={16} />}
                  </span>
                )}
                <span className="max-w-32 truncate text-sm font-medium">{profileName}</span>
              </div>
              <Button variant="outline" onClick={switchToBlog}>
                <BookOpen size={16} />
                Public blog
              </Button>
              <a href={API_PATHS.googleLogin}>
                <Button variant="ghost" size="icon" aria-label="Sign in with Google">
                  <LogIn size={17} />
                </Button>
              </a>
            </div>
          </div>
        </header>
        <main className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[300px_1fr] lg:px-12 lg:py-12">
          <aside className="space-y-5">
            <div className="rounded-2xl border border-black/8 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                {profileImage ? (
                  <img alt={`${profileName} profile`} className="size-12 rounded-2xl object-cover" src={profileImage} />
                ) : (
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#dfe8c2] text-sm font-semibold text-[#53652b] dark:bg-[#b4cc5c]/20 dark:text-[#d9f06a]">
                    {profileInitials || <UserRound size={18} />}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{profileName}</p>
                  <p className="truncate text-xs text-[#7b847d]">{profile?.email ?? "Profile settings"}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="block text-xs font-medium text-[#687069] dark:text-[#aab2aa]">Profile image URL</label>
                <input
                  className="h-9 w-full rounded-lg border border-black/10 bg-[#fbfbf9] px-3 text-xs outline-none focus:border-[#95ae4b] dark:border-white/10 dark:bg-white/5"
                  onChange={(event) => setProfileUrlDraft(event.target.value)}
                  placeholder="https://…"
                  type="url"
                  value={profileUrlDraft}
                />
                <div className="flex gap-2">
                  <input accept="image/*" className="hidden" onChange={(event) => void handleProfileImageSelected(event)} ref={profileFileInputRef} type="file" />
                  <Button className="flex-1" disabled={isProfileUploading} onClick={() => profileFileInputRef.current?.click()} size="sm" type="button" variant="outline">
                    {isProfileUploading ? <LoaderCircle className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                    {isProfileUploading ? "Uploading…" : "Upload"}
                  </Button>
                  <Button disabled={isProfileSaving || !profileUrlDraft.trim()} onClick={() => void saveProfileUrl()} size="sm" type="button">
                    {isProfileSaving ? <LoaderCircle className="animate-spin" size={14} /> : <Save size={14} />}
                    Save
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b847d]">Workspace</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your posts</h1>
              </div>
              <Button size="icon" aria-label="Create a new post" onClick={startNewPost}>
                <Plus size={18} />
              </Button>
            </div>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-[#7b847d] dark:border-white/10 dark:bg-white/5">
              <Search size={16} />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-[#9ca39d]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search posts"
                value={search}
              />
            </label>
            {isLoading ? (
              <div className="flex items-center gap-2 py-5 text-sm text-[#7b847d]">
                <LoaderCircle className="animate-spin" size={16} /> Loading posts…
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 p-5 text-sm text-[#7b847d] dark:border-white/15">
                No posts match your search.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPosts.map((post) => (
                  <button
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedPostId === post.id
                        ? "border-[#afc95a] bg-[#eff7d8] dark:border-[#8ea63e] dark:bg-[#b4cc5c]/10"
                        : "border-black/8 bg-white hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                    }`}
                    key={post.id}
                    onClick={() => selectPost(post)}
                    type="button"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <StatusPill status={post.status} />
                      <MoreHorizontal size={16} className="text-[#929a94]" />
                    </div>
                    <p className="line-clamp-2 font-medium leading-snug">{post.title}</p>
                    <p className="mt-2 text-xs text-[#7b847d]">{formatDate(post.updatedAt ?? post.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="min-w-0">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b847d]">
                  {selectedPostId ? "Edit story" : "New story"}
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {selectedPostId ? draft.title || "Untitled post" : "Make something worth reading."}
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                {autosaveStatus !== "idle" && (
                  <div
                    className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-xs text-[#687069] dark:border-white/10 dark:bg-white/5 dark:text-[#aab2aa]"
                    role="status"
                  >
                    {autosaveStatus === "saving" ? (
                      <LoaderCircle className="animate-spin" size={13} />
                    ) : (
                      <Check className="text-[#718b32]" size={13} />
                    )}
                    <span>
                      {autosaveStatus === "recovered"
                        ? autosavedAt
                          ? `Recovered local draft · saved at ${formatSavedTime(autosavedAt)}`
                          : "Recovered local draft"
                        : autosaveStatus === "saving"
                          ? "Saving locally…"
                          : autosavedAt
                            ? `Saved locally at ${formatSavedTime(autosavedAt)}`
                            : "Saved locally"}
                    </span>
                  </div>
                )}
                {selectedPostId && (
                  <Button disabled={isDeleting} onClick={() => void handleDelete()} variant="destructive">
                    {isDeleting ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    Delete
                  </Button>
                )}
                <Button disabled={isSaving} form="post-editor" type="submit">
                  {isSaving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
                  Save {draft.status === "published" ? "published post" : "draft"}
                </Button>
              </div>
            </div>

            {(errorMessage || statusMessage) && (
              <div className="mb-6 space-y-2">
                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                    <CircleAlert className="mt-0.5 shrink-0" size={17} />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {statusMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-[#cfe19c] bg-[#f1f8dd] px-4 py-3 text-sm text-[#4b5d1e] dark:border-[#b4cc5c]/20 dark:bg-[#b4cc5c]/10 dark:text-[#d8ee91]">
                    <Check className="mt-0.5 shrink-0" size={17} />
                    <span>{statusMessage}</span>
                  </div>
                )}
              </div>
            )}

            <form className="grid gap-5" id="post-editor" onSubmit={(event) => void handleSave(event)}>
              <div className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(23,31,24,0.45)] sm:p-7 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium">Title</span>
                    <input
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 text-lg font-medium outline-none transition focus:border-[#95ae4b] focus:ring-3 focus:ring-[#b4cc5c]/20 dark:border-white/10 dark:bg-white/5"
                      onChange={(event) => updateDraft("title", event.target.value)}
                      placeholder="A thought worth sharing"
                      value={draft.title}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium">Slug</span>
                    <div className="flex h-11 items-center rounded-xl border border-black/10 bg-[#fbfbf9] px-4 dark:border-white/10 dark:bg-white/5">
                      <span className="mr-1 text-sm text-[#929a94]">/notes/</span>
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                        onChange={(event) => updateDraft("slug", event.target.value)}
                        placeholder="your-post-slug"
                        value={draft.slug}
                      />
                    </div>
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium">Excerpt</span>
                    <textarea
                      className="min-h-20 w-full resize-y rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#95ae4b] focus:ring-3 focus:ring-[#b4cc5c]/20 dark:border-white/10 dark:bg-white/5"
                      onChange={(event) => updateDraft("excerpt", event.target.value)}
                      placeholder="A one or two sentence invitation to read more."
                      value={draft.excerpt}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">Content</span>
                      <div className="inline-flex rounded-lg border border-black/10 bg-[#fbfbf9] p-1 text-xs dark:border-white/10 dark:bg-white/5">
                        {(["write", "preview"] as const).map((mode) => (
                          <button
                            aria-pressed={editorMode === mode}
                            className={`rounded-md px-3 py-1.5 font-medium transition ${
                              editorMode === mode
                                ? "bg-white text-[#536c21] shadow-sm dark:bg-white/10 dark:text-[#d9f06a]"
                                : "text-[#7b847d] hover:text-foreground"
                            }`}
                            key={mode}
                            onClick={() => setEditorMode(mode)}
                            type="button"
                          >
                            {mode === "write" ? "Write" : "Preview"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {editorMode === "write" ? (
                      <textarea
                        aria-label="Post content"
                        className="min-h-64 w-full resize-y rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#95ae4b] focus:ring-3 focus:ring-[#b4cc5c]/20 dark:border-white/10 dark:bg-white/5"
                        onChange={(event) => updateDraft("content", event.target.value)}
                        placeholder="Start writing here…"
                        value={draft.content}
                      />
                    ) : (
                      <div className="min-h-64 rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm text-[#3f4740] dark:border-white/10 dark:bg-white/5 dark:text-[#d0d6cd]">
                        <MarkdownPreview content={draft.content} />
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-[1fr_280px]">
                <div className="rounded-3xl border border-black/8 bg-white p-5 sm:p-7 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Cover image</h3>
                      <p className="mt-1 text-sm text-[#7b847d]">A wide image works best.</p>
                    </div>
                    <input accept="image/*" className="hidden" onChange={(event) => void handleImageSelected(event)} ref={fileInputRef} type="file" />
                    <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()} type="button" variant="outline">
                      {isUploading ? <LoaderCircle className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                      {isUploading ? "Uploading…" : "Upload image"}
                    </Button>
                  </div>
                  {draft.coverImage ? (
                    <div className="group relative overflow-hidden rounded-2xl">
                      <img alt="Selected cover" className="aspect-[2.4/1] w-full object-cover" src={draft.coverImage} />
                      <button
                        aria-label="Remove cover image"
                        className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100"
                        onClick={() => updateDraft("coverImage", "")}
                        type="button"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex aspect-[2.4/1] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-[#fbfbf9] text-sm text-[#7b847d] transition hover:border-[#95ae4b] hover:text-[#526625] dark:border-white/15 dark:bg-white/5"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <ImagePlus size={22} />
                      Add a cover image
                    </button>
                  )}
                </div>
                <div className="rounded-3xl border border-black/8 bg-white p-5 sm:p-7 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-medium">Publishing</h3>
                  <p className="mt-1 text-sm text-[#7b847d]">Choose who can read this.</p>
                  <div className="mt-5 grid gap-2">
                    {(["draft", "published"] as PostStatus[]).map((status) => (
                      <button
                        className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                          draft.status === status
                            ? "border-[#afc95a] bg-[#eff7d8] text-[#43521d] dark:border-[#8ea63e] dark:bg-[#b4cc5c]/10 dark:text-[#e2f39e]"
                            : "border-black/8 hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
                        }`}
                        key={status}
                        onClick={() => updateDraft("status", status)}
                        type="button"
                      >
                        <span className="flex items-center gap-2">
                          {status === "published" ? <Check size={16} /> : <FilePenLine size={16} />}
                          {status === "published" ? "Published" : "Draft"}
                        </span>
                        {draft.status === status && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbfcf8] text-[#20251f] dark:bg-[#101311] dark:text-[#f1f3ee]">
      <header className="sticky top-0 z-10 border-b border-black/8 bg-[#fbfcf8]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#101311]/85">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <a className="flex items-center gap-3" href="#">
            <span className="grid size-9 place-items-center rounded-xl bg-[#d9f06a] text-[#253014]">
              <Sparkles size={18} strokeWidth={2.5} />
            </span>
            <span className="font-semibold tracking-tight">Canto Notes</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-[#687069] md:flex dark:text-[#aab2aa]">
            <a className="transition hover:text-foreground" href="#notes">Notes</a>
            <a className="transition hover:text-foreground" href="#about">About</a>
            <a className="transition hover:text-foreground" href="#newsletter">Newsletter</a>
          </nav>
          <div className="flex items-center gap-2">
            <nav
              aria-label="Workspace navigation"
              className="hidden items-center gap-1 rounded-xl border border-black/8 bg-white/70 p-1 text-xs dark:border-white/10 dark:bg-white/5 sm:flex"
            >
              <span
                aria-current="page"
                className="rounded-lg bg-[#eff7d8] px-3 py-1.5 font-semibold text-[#536c21] dark:bg-[#b4cc5c]/15 dark:text-[#d9f06a]"
              >
                Public blog
              </span>
              <button
                className="rounded-lg px-3 py-1.5 text-[#687069] transition hover:bg-black/[0.04] dark:text-[#aab2aa] dark:hover:bg-white/5"
                onClick={switchToAdmin}
                type="button"
              >
                Admin studio
              </button>
            </nav>
            <a className="hidden sm:block" href={API_PATHS.googleLogin}>
              <Button variant="outline">
                <LogIn size={16} /> Sign in
              </Button>
            </a>
            <Button aria-label="Open menu" className="md:hidden" onClick={() => setMenuOpen((open) => !open)} size="icon" variant="ghost">
              <Menu size={19} />
            </Button>
            <Button onClick={switchToAdmin} variant="default">
              Open studio <ArrowUpRight size={16} />
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-black/8 px-5 py-3 text-sm md:hidden dark:border-white/10">
            <div className="flex flex-col gap-3">
              <a href="#notes" onClick={() => setMenuOpen(false)}>Notes</a>
              <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
              <a href="#newsletter" onClick={() => setMenuOpen(false)}>Newsletter</a>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-[1240px] px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:px-10 lg:pb-24">
          <div className="max-w-3xl">
            <p className="mb-5 flex items-center gap-2 text-sm font-medium text-[#70872f] dark:text-[#c7e46e]">
              <span className="size-2 rounded-full bg-[#b4cc5c]" /> Personal notes on making, noticing, and becoming
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">
              A small corner of the internet for <span className="text-[#91a842]">big thoughts.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#687069] dark:text-[#aab2aa]">
              Essays, experiments, and reminders to slow down. Written from a desk by the window, shared with whoever finds their way here.
            </p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            {isLoading ? (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-black/8 bg-white text-sm text-[#7b847d] dark:border-white/10 dark:bg-white/5">
                <LoaderCircle className="mr-2 animate-spin" size={17} /> Loading the latest notes…
              </div>
            ) : featuredPost ? (
              <article
                aria-label={`Read ${featuredPost.title}`}
                className="group relative min-h-72 cursor-pointer overflow-hidden rounded-3xl bg-[#27331e] text-white sm:min-h-96"
                onClick={() => setPublicPostId(featuredPost.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setPublicPostId(featuredPost.id)
                }}
                role="button"
                tabIndex={0}
              >
                {featuredPost.coverImage && (
                  <img alt="" className="absolute inset-0 size-full object-cover opacity-55 transition duration-700 group-hover:scale-105" src={featuredPost.coverImage} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#172015] via-[#25321e]/45 to-transparent" />
                <div className="relative flex min-h-72 flex-col justify-end p-6 sm:min-h-96 sm:p-9">
                  <div className="mb-auto flex items-center justify-between text-xs font-medium uppercase tracking-[0.15em] text-[#d9f06a]">
                    <span>Featured note</span><ArrowUpRight size={17} />
                  </div>
                  <div>
                    <p className="mb-3 text-sm text-white/70">{formatDate(featuredPost.createdAt)} · {readingTime(featuredPost.content)}</p>
                    <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.035em] sm:text-5xl">{featuredPost.title}</h2>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">{featuredPost.excerpt}</p>
                  </div>
                </div>
              </article>
            ) : (
              <div className="flex min-h-72 items-center rounded-3xl border border-dashed border-black/15 p-8 text-[#7b847d] dark:border-white/15">No published notes yet.</div>
            )}
            <div className="flex flex-col justify-between rounded-3xl bg-[#eaf2cf] p-6 sm:p-8 dark:bg-[#c4dc70]/10">
              <div>
                <span className="grid size-10 place-items-center rounded-full bg-[#d9f06a] text-[#354414]"><Clock3 size={19} /></span>
                <h2 className="mt-7 max-w-xs text-2xl font-semibold leading-tight tracking-[-0.035em]">Good ideas need a little room.</h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#65704d] dark:text-[#bdcaa3]">A new note lands every few weeks. No noise, just a thoughtful letter when there is something to say.</p>
              </div>
              <a className="mt-10 flex items-center gap-2 text-sm font-semibold text-[#536c21] dark:text-[#d9f06a]" href="#newsletter">Join the quiet list <ChevronRight size={16} /></a>
            </div>
          </div>
          {selectedPublicPost && (
            <article className="mt-6 overflow-hidden rounded-3xl border border-black/8 bg-white dark:border-white/10 dark:bg-white/5">
              {selectedPublicPost.coverImage && (
                <img
                  alt=""
                  className="max-h-[520px] w-full object-cover"
                  src={selectedPublicPost.coverImage}
                />
              )}
              <div className="p-6 sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#7b847d]">
                  <span>{formatDate(selectedPublicPost.createdAt)} · {readingTime(selectedPublicPost.content)}</span>
                  <button
                    className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium transition hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/5"
                    onClick={() => setPublicPostId(null)}
                    type="button"
                  >
                    Close <X size={14} />
                  </button>
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">{selectedPublicPost.title}</h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#687069] dark:text-[#aab2aa]">{selectedPublicPost.excerpt}</p>
                <div className="prose prose-neutral mt-8 max-w-2xl whitespace-pre-wrap text-base leading-8 text-[#3f4740] dark:text-[#d0d6cd]">
                  {selectedPublicPost.content}
                </div>
              </div>
            </article>
          )}
        </section>

        <section className="border-t border-black/8 dark:border-white/10" id="notes">
          <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#70872f] dark:text-[#c7e46e]">From the notebook</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Recent notes</h2>
              </div>
              <span className="hidden text-sm text-[#7b847d] sm:block">{publishedPosts.length} published notes</span>
            </div>
            {publishedPosts.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-dashed border-black/15 p-10 text-center text-[#7b847d] dark:border-white/15">The next note is still taking shape.</div>
            ) : (
              <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {publishedPosts.slice(1).map((post) => (
                  <article className="group" key={post.id}>
                    <div className="mb-5 aspect-[1.5/1] overflow-hidden rounded-2xl bg-[#e8ece2] dark:bg-white/10">
                      <button aria-label={`Read ${post.title}`} className="size-full" onClick={() => setPublicPostId(post.id)} type="button">
                        {post.coverImage ? <img alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" src={post.coverImage} /> : <div className="grid size-full place-items-center text-[#9aa397]"><BookOpen size={28} /></div>}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#7b847d]"><span>{formatDate(post.createdAt)}</span><span>·</span><span>{readingTime(post.content)}</span></div>
                    <h3 className="mt-3 text-xl font-semibold leading-tight tracking-[-0.025em] transition group-hover:text-[#748d32]">{post.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#687069] dark:text-[#aab2aa]">{post.excerpt}</p>
                    <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#718b32]" onClick={() => setPublicPostId(post.id)} type="button">Read note <ArrowUpRight size={14} /></button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] gap-6 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-24" id="about">
          <div className="rounded-3xl bg-[#1f2920] p-7 text-white sm:p-10">
            <p className="text-sm font-medium text-[#d9f06a]">A little about this place</p>
            <h2 className="mt-6 max-w-md text-3xl font-medium leading-tight tracking-[-0.04em]">The best work usually starts as a note to yourself.</h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/65">Canto Notes is a personal blog about creative practice, technology with a human shape, and the small systems that help us pay attention.</p>
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-black/8 bg-white p-7 sm:p-10 dark:border-white/10 dark:bg-white/5" id="newsletter">
            <div>
              <p className="text-sm font-medium text-[#70872f] dark:text-[#c7e46e]">The quiet list</p>
              <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-[-0.04em]">A note in your inbox, occasionally.</h2>
            </div>
            <form className="mt-10 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => event.preventDefault()}>
              <input aria-label="Email address" className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 bg-[#fbfcf8] px-4 text-sm outline-none focus:border-[#95ae4b] dark:border-white/10 dark:bg-white/5" placeholder="you@example.com" type="email" />
              <Button type="submit">Subscribe <ArrowUpRight size={16} /></Button>
            </form>
          </div>
        </section>
      </main>
      <footer className="border-t border-black/8 dark:border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-7 text-sm text-[#7b847d] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© 2026 Canto Notes</span>
          <span className="flex items-center gap-2">Made with attention <span className="size-1.5 rounded-full bg-[#b4cc5c]" /></span>
        </div>
      </footer>
    </div>
  )
}

export { App }
