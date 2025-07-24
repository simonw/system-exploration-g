import { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MagnifyingGlass, Copy, Check, Code, Database, User, Sparkle, List } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
      toast.success('Code copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  const CodeBlock = ({ code, id, title }: { code: string; id: string; title?: string }) => (
    <div className="relative group">
      {title && <div className="text-sm font-medium text-muted-foreground mb-2">{title}</div>}
      <div className="bg-muted rounded-lg p-4 relative">
        <pre className="text-sm font-mono overflow-x-auto">
          <code>{code}</code>
        </pre>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => copyToClipboard(code, id)}
        >
          {copiedCode === id ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    </div>
  )

  const sections: Section[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <Sparkle size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Spark API Documentation</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Comprehensive guide to building applications with the Spark platform
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>What is Spark?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Spark is a specialized runtime environment for building micro-applications (called "sparks") 
                using React and TypeScript. It provides a unique set of APIs for persistence, AI integration, 
                and user management.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <Database className="mb-2" size={24} />
                  <h3 className="font-semibold">Persistence</h3>
                  <p className="text-sm text-muted-foreground">Key-value storage with React hooks</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <Code className="mb-2" size={24} />
                  <h3 className="font-semibold">LLM Integration</h3>
                  <p className="text-sm text-muted-foreground">Direct access to language models</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <User className="mb-2" size={24} />
                  <h3 className="font-semibold">User Context</h3>
                  <p className="text-sm text-muted-foreground">GitHub user information and permissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'persistence',
      title: 'Persistence API',
      icon: <Database size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Persistence API</h2>
            <p className="text-muted-foreground mb-6">
              Store and retrieve data that persists between sessions using the useKV hook or direct API.
            </p>
          </div>

          <Tabs defaultValue="useKV" className="w-full">
            <TabsList>
              <TabsTrigger value="useKV">useKV Hook</TabsTrigger>
              <TabsTrigger value="direct">Direct API</TabsTrigger>
            </TabsList>
            
            <TabsContent value="useKV" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    useKV Hook <Badge variant="secondary">Recommended</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>The useKV hook provides reactive state management with automatic persistence.</p>
                  
                  <CodeBlock
                    id="useKV-import"
                    title="Import"
                    code="import { useKV } from '@github/spark/hooks'"
                  />
                  
                  <CodeBlock
                    id="useKV-basic"
                    title="Basic Usage"
                    code={`const [value, setValue, deleteValue] = useKV("unique-key", defaultValue)

// Examples
const [todos, setTodos] = useKV("user-todos", [])
const [counter, setCounter] = useKV("counter-value", 0)
const [preferences, setPreferences] = useKV("user-prefs", { theme: "light" })`}
                  />
                  
                  <CodeBlock
                    id="useKV-functional"
                    title="Functional Updates (Recommended)"
                    code={`// ❌ WRONG - Don't reference from closure (stale closure issue)
setTodos([...todos, newTodo])

// ✅ CORRECT - Use functional update
setTodos((currentTodos) => [...currentTodos, newTodo])

// Examples
setTodos((currentTodos) => [...currentTodos, { id: Date.now(), text: "New todo" }])
setTodos((currentTodos) => currentTodos.filter(todo => todo.id !== todoId))
setTodos((currentTodos) => 
  currentTodos.map(todo => 
    todo.id === todoId ? { ...todo, completed: true } : todo
  )
)`}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="direct" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Direct API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Direct access to the key-value store for non-React contexts.</p>
                  
                  <CodeBlock
                    id="direct-api"
                    title="Direct API Methods"
                    code={`// Set a value
await spark.kv.set("user-preference", { theme: "dark" })

// Get a value
const preference = await spark.kv.get<{theme: string}>("user-preference")

// Get all keys
const allKeys = await spark.kv.keys()

// Delete a value
await spark.kv.delete("user-preference")`}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )
    },
    {
      id: 'llm',
      title: 'LLM API',
      icon: <Code size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">LLM API</h2>
            <p className="text-muted-foreground mb-6">
              Direct access to language models for AI-powered features in your applications.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Creating Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-600 font-medium">⚠️ ALL prompts MUST be created using spark.llmPrompt!</p>
              
              <CodeBlock
                id="llm-prompt"
                title="Prompt Creation"
                code={`const prompt = spark.llmPrompt\`Generate a summary of: \${content}\`

// More complex example
const topic = "machine learning"
const audience = "beginners"
const prompt = spark.llmPrompt\`Write a \${audience}-friendly explanation of \${topic}\``}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Executing LLM Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold mb-2">Available Models</h4>
                  <ul className="space-y-1 text-sm">
                    <li><Badge variant="outline">gpt-4o</Badge> (default)</li>
                    <li><Badge variant="outline">gpt-4o-mini</Badge></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Options</h4>
                  <ul className="space-y-1 text-sm">
                    <li><code>jsonMode</code>: Return valid JSON</li>
                  </ul>
                </div>
              </div>
              
              <CodeBlock
                id="llm-execution"
                title="Basic Execution"
                code={`const result = await spark.llm(prompt)
const jsonResult = await spark.llm(prompt, "gpt-4o-mini", true)`}
              />
              
              <CodeBlock
                id="llm-complete"
                title="Complete Example"
                code={`const topic = "machine learning"
const prompt = spark.llmPrompt\`Write a brief explanation of \${topic}\`
const explanation = await spark.llm(prompt)

// JSON mode example
const dataPrompt = spark.llmPrompt\`Convert this text to structured data: \${text}\`
const structuredData = await spark.llm(dataPrompt, "gpt-4o", true)`}
              />
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'user',
      title: 'User API',
      icon: <User size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">User API</h2>
            <p className="text-muted-foreground mb-6">
              Access current user information and implement owner-only features.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="user-basic"
                title="Get User Info"
                code={`const user = await spark.user()
// Returns: { avatarUrl, email, id, isOwner, login }`}
              />
              
              <CodeBlock
                id="user-conditional"
                title="Conditional Features"
                code={`const user = await spark.user()
if (user.isOwner) {
  // Show admin features
  renderAdminPanel()
} else {
  // Show regular user features
  renderUserPanel()
}`}
              />
              
              <CodeBlock
                id="user-display"
                title="Display User Info"
                code={`const user = await spark.user()

return (
  <div className="flex items-center gap-2">
    <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
    <span>{user.login}</span>
    {user.isOwner && <Badge>Owner</Badge>}
  </div>
)`}
              />
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'system-prompt',
      title: 'System Prompt',
      icon: <Sparkle size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Complete System Prompt</h2>
            <p className="text-muted-foreground mb-6">
              The full system prompt that defines how Spark agents work and what capabilities they have.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Template Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Every Spark app starts with this optimized template structure:</p>
              
              <CodeBlock
                id="template-structure"
                title="Project Structure"
                code={`├── index.html          // Entry point with required imports
├── package.json        // Managed via npm tool only
├── src/
│   ├── App.tsx         // Main React component (default export)
│   ├── components/
│   │   └── ui/         // 40+ preinstalled shadcn v4 components
│   ├── hooks/
│   │   └── use-mobile.ts
│   ├── index.css       // Custom CSS and theme definitions
│   ├── lib/
│   │   └── utils.ts    // Utilities with shadcn class helper
│   ├── main.css        // Structural CSS (DO NOT EDIT)
│   ├── main.tsx        // Structural TSX (DO NOT EDIT)
│   └── styles/
│       └── theme.css
├── theme.json
└── vite.config.ts      // Pre-configured (DO NOT EDIT)`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coding Standards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Element IDs</h4>
                  <p className="text-sm text-muted-foreground mb-2">Use descriptive kebab-case IDs for state persistence</p>
                  <CodeBlock
                    id="element-ids"
                    code={`<input id="first-name" />
<input id="email-address" />
<textarea id="message-content" />`}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Imports</h4>
                  <p className="text-sm text-muted-foreground mb-2">Import by package name only, no versions or CDN URLs</p>
                  <CodeBlock
                    id="imports"
                    code={`// ✅ Correct
import React from "react"
import { Button } from "@/components/ui/button"
import myImage from '@/assets/images/logo.png'

// ❌ Wrong
import React from "react@18.2.0"
import { Button } from "https://cdn.jsdelivr.net/..."`}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Data Persistence Rules</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2">
                    <p className="text-sm font-medium text-yellow-800">Simple Rule: "Should this survive a page refresh?"</p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• If YES → use <code>useKV</code></li>
                      <li>• If NO → use <code>useState</code></li>
                    </ul>
                  </div>
                  <CodeBlock
                    id="persistence-rules"
                    code={`// Persistent data (survives refresh)
const [todos, setTodos] = useKV("user-todos", [])
const [preferences, setPreferences] = useKV("user-prefs", {})

// Temporary data (doesn't survive refresh)
const [inputValue, setInputValue] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [selectedTab, setSelectedTab] = useState("overview")`}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Asset Management</h4>
                  <p className="text-sm text-muted-foreground mb-2">Always import assets explicitly, never use string paths</p>
                  <CodeBlock
                    id="asset-imports"
                    code={`// ✅ Correct - import explicitly
import myImage from '@/assets/images/logo.png'
import myVideo from '@/assets/video/hero.mp4'
import myAudio from '@/assets/audio/click.mp3'

// Then use in JSX
<img src={myImage} />
<video src={myVideo} />

// ❌ Wrong - string paths
<img src="@/assets/images/logo.png" />`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UI & Styling Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Component Library</h4>
                  <p className="text-sm text-muted-foreground mb-2">Strongly prefer shadcn components over plain HTML</p>
                  <CodeBlock
                    id="shadcn-components"
                    code={`// ✅ Preferred
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Use shadcn components
<Button variant="outline">Click me</Button>
<Card>
  <CardContent>Content here</CardContent>
</Card>

// ❌ Avoid plain HTML when shadcn exists
<button>Click me</button>
<div className="card">Content</div>`}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Styling with Tailwind</h4>
                  <p className="text-sm text-muted-foreground mb-2">Use utility classes and theme variables</p>
                  <CodeBlock
                    id="tailwind-styling"
                    code={`// Use theme variables
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">
<Card className="bg-card text-card-foreground">

// Layout with grid/flex and gap
<div className="flex gap-4">
<div className="grid grid-cols-2 gap-6">

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">`}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Icons</h4>
                  <p className="text-sm text-muted-foreground mb-2">Use Phosphor Icons with default size and weight</p>
                  <CodeBlock
                    id="icons"
                    code={`import { Plus, Search, User, Settings } from "@phosphor-icons/react"

// ✅ Use with default size/weight
<Plus />
<Search />

// ✅ Color for plain icon buttons
<Plus className="text-primary" />

// ❌ Don't override size/weight unless requested
<Plus size={24} weight="bold" />`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Libraries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Recommended for:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Charts/Viz:</strong> D3</li>
                    <li>• <strong>3D:</strong> Three.js</li>
                    <li>• <strong>HTTP:</strong> Fetch API</li>
                    <li>• <strong>Audio:</strong> Web Audio API</li>
                    <li>• <strong>Animations:</strong> Framer Motion</li>
                    <li>• <strong>Forms:</strong> React Hook Form</li>
                    <li>• <strong>Notifications:</strong> Sonner</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Avoid:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <code>alert()</code>, <code>confirm()</code></li>
                    <li>• <code>localStorage</code>, <code>sessionStorage</code></li>
                    <li>• Node-only packages</li>
                    <li>• CDN URLs or version-specific imports</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: <Check size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
            <p className="text-muted-foreground mb-6">
              Essential patterns and recommendations for building high-quality Spark applications.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>State Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Functional Updates with useKV</h4>
                  <p className="text-sm text-muted-foreground mb-2">Always use functional updates to avoid stale closure issues</p>
                  <CodeBlock
                    id="functional-updates"
                    code={`// ❌ WRONG - Stale closure issue
const [todos, setTodos] = useKV("todos", [])
const addTodo = () => {
  setTodos([...todos, newTodo]) // 'todos' might be stale
}

// ✅ CORRECT - Functional update
const addTodo = () => {
  setTodos(currentTodos => [...currentTodos, newTodo])
}

// ✅ CORRECT - Complex operations
const toggleTodo = (id) => {
  setTodos(currentTodos => 
    currentTodos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  )
}`}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Choosing Between useState and useKV</h4>
                  <CodeBlock
                    id="state-choice"
                    code={`// Persistent data - use useKV
const [userPreferences, setUserPreferences] = useKV("prefs", { theme: "light" })
const [savedDocuments, setSavedDocuments] = useKV("docs", [])
const [gameScore, setGameScore] = useKV("score", 0)

// Temporary UI state - use useState  
const [isModalOpen, setIsModalOpen] = useState(false)
const [searchQuery, setSearchQuery] = useState("")
const [currentPage, setCurrentPage] = useState(1)
const [isLoading, setIsLoading] = useState(false)`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="error-handling"
                title="LLM API Error Handling"
                code={`const generateContent = async () => {
  try {
    setIsLoading(true)
    const prompt = spark.llmPrompt\`Generate content about \${topic}\`
    const result = await spark.llm(prompt)
    setContent(result)
    toast.success("Content generated successfully!")
  } catch (error) {
    console.error("Failed to generate content:", error)
    toast.error("Failed to generate content. Please try again.")
  } finally {
    setIsLoading(false)
  }
}`}
              />

              <CodeBlock
                id="kv-error-handling"
                title="KV Storage Error Handling"
                code={`const saveData = async () => {
  try {
    await spark.kv.set("user-data", userData)
    toast.success("Data saved successfully!")
  } catch (error) {
    console.error("Failed to save data:", error)
    toast.error("Failed to save data")
  }
}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Efficient Re-renders</h4>
                  <CodeBlock
                    id="performance-tips"
                    code={`// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// Use useCallback for event handlers passed to children
const handleItemClick = useCallback((id: string) => {
  setSelectedItem(id)
}, [])

// Memoize components that receive objects as props
const MemoizedComponent = memo(({ data }: { data: ComplexObject }) => {
  return <div>{data.title}</div>
})`}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Optimizing KV Operations</h4>
                  <CodeBlock
                    id="kv-optimization"
                    code={`// Batch related operations
const updateUserProfile = useCallback(async (updates) => {
  setProfile(current => ({ ...current, ...updates }))
  // KV automatically batches rapid updates
}, [setProfile])

// Use meaningful keys for better organization
const [userSettings, setUserSettings] = useKV("user:settings", {})
const [appData, setAppData] = useKV("app:data", [])

// Clean up unused keys when appropriate
const deleteOldData = async () => {
  await spark.kv.delete("obsolete-key")
}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="accessibility"
                title="Accessible Components"
                code={`// Use semantic HTML and ARIA labels
<Button 
  aria-label="Add new item"
  onClick={handleAdd}
>
  <Plus aria-hidden="true" />
</Button>

// Proper form labels
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input 
    id="email" 
    type="email"
    aria-describedby="email-error"
    aria-invalid={hasError}
  />
  {hasError && (
    <p id="email-error" className="text-destructive text-sm">
      Please enter a valid email address
    </p>
  )}
</div>

// Focus management
useEffect(() => {
  if (isModalOpen) {
    modalRef.current?.focus()
  }
}, [isModalOpen])`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Responsiveness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="mobile-responsive"
                title="Responsive Design Patterns"
                code={`import { useIsMobile } from '@/hooks/use-mobile'

function ResponsiveComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn(
      "grid gap-4",
      isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
    )}>
      {/* Touch-friendly targets on mobile */}
      <Button 
        size={isMobile ? "lg" : "default"}
        className="min-h-[44px]" // Minimum touch target
      >
        Action
      </Button>
    </div>
  )
}

// Responsive navigation
{isMobile ? (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu />
      </Button>
    </SheetTrigger>
    <SheetContent>
      <Navigation />
    </SheetContent>
  </Sheet>
) : (
  <Navigation />
)}`}
              />
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  const filteredSections = sections.filter(section =>
    searchQuery === '' ||
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toString().toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeContent = sections.find(s => s.id === activeSection)?.content

  const SidebarContent = () => (
    <div className="w-64 bg-card border-r border-border p-4 min-h-screen">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Spark Docs</h2>
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <nav className="space-y-2">
        {filteredSections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setActiveSection(section.id)
              if (isMobile) setSidebarOpen(false)
            }}
          >
            {section.icon}
            <span className="ml-2">{section.title}</span>
          </Button>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && <SidebarContent />}

        {/* Mobile Header */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">Spark Docs</h1>
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <List size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <ScrollArea className="h-screen">
            <div className={`p-8 max-w-4xl ${isMobile ? 'pt-20' : ''}`}>
              {activeContent}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

export default App