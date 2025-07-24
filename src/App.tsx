import { useState, useEffect, useCallback } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Code, Database, User, Sparkle, List, Play, Download, Monitor, Link } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SYSTEM_PROMPT_CONTENT, TOOLS_CONTENT } from './prompts-content'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  // Navigation with URL fragments
  const navigateToSection = useCallback((sectionId: string, fragmentId?: string) => {
    setActiveSection(sectionId)
    const url = fragmentId ? `#${sectionId}--${fragmentId}` : `#${sectionId}`
    window.history.pushState({ sectionId, fragmentId }, '', url)
    
    // Scroll to fragment if specified
    if (fragmentId) {
      setTimeout(() => {
        const element = document.getElementById(fragmentId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } else {
      // Scroll to top of section
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
    
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const hash = window.location.hash.slice(1) // Remove #
      if (hash) {
        const [sectionId, fragmentId] = hash.split('--')
        if (sectionId) {
          setActiveSection(sectionId)
          if (fragmentId) {
            setTimeout(() => {
              const element = document.getElementById(fragmentId)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 100)
          }
        }
      } else {
        setActiveSection('overview')
      }
    }

    // Initialize from URL on page load
    const hash = window.location.hash.slice(1)
    if (hash) {
      const [sectionId, fragmentId] = hash.split('--')
      if (sectionId && sections.find(s => s.id === sectionId)) {
        setActiveSection(sectionId)
        if (fragmentId) {
          setTimeout(() => {
            const element = document.getElementById(fragmentId)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 500) // Longer delay for initial load
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Playground state
  const [kvKey, setKvKey] = useState('test-key')
  const [kvValue, setKvValue] = useState('{"example": "value"}')
  const [kvResult, setKvResult] = useState('')
  const [kvKeys, setKvKeys] = useState<string[]>([])
  const [llmPrompt, setLlmPrompt] = useState('Write a haiku about programming')
  const [llmModel, setLlmModel] = useState('gpt-4o')
  const [llmJsonMode, setLlmJsonMode] = useState(false)
  const [llmResult, setLlmResult] = useState('')
  const [llmLoading, setLlmLoading] = useState(false)
  const [userInfo, setUserInfo] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [systemPromptText, setSystemPromptText] = useState('')
  const [systemPromptLoading, setSystemPromptLoading] = useState(false)
  const [toolsText, setToolsText] = useState('')
  const [toolsLoading, setToolsLoading] = useState(false)

  // Load system prompt and tools on mount
  useEffect(() => {
    const loadSystemPrompt = () => {
      try {
        setSystemPromptLoading(true)
        setSystemPromptText(SYSTEM_PROMPT_CONTENT)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load system prompt'
        setSystemPromptText(`❌ Error loading system prompt: ${errorMsg}`)
      } finally {
        setSystemPromptLoading(false)
      }
    }

    const loadTools = () => {
      try {
        setToolsLoading(true)
        
        let text = TOOLS_CONTENT
        // Replace HTML entities with actual characters
        text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        
        // Pretty-print JSON within <function> tags
        text = text.replace(/<function>({.*?})<\/function>/gs, (match, jsonContent) => {
          try {
            const parsed = JSON.parse(jsonContent)
            const formatted = JSON.stringify(parsed, null, 2)
            return `<function>\n${formatted}\n</function>`
          } catch (e) {
            // If JSON parsing fails, return original
            return match
          }
        })
        
        setToolsText(text)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load tools documentation'
        setToolsText(`❌ Error loading tools: ${errorMsg}`)
      } finally {
        setToolsLoading(false)
      }
    }

    loadSystemPrompt()
    loadTools()

    // Load KV keys
    const loadKeys = async () => {
      try {
        const keys = await spark.kv.keys()
        setKvKeys(keys)
      } catch (error) {
        console.error('Failed to load keys:', error)
      }
    }
    loadKeys()
  }, [])

  // KV operations
  const handleKvSet = async () => {
    try {
      const parsedValue = JSON.parse(kvValue)
      await spark.kv.set(kvKey, parsedValue)
      setKvResult(`✅ Set "${kvKey}" successfully`)
      const keys = await spark.kv.keys()
      setKvKeys(keys)
      toast.success('Value set successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to set value'
      setKvResult(`❌ Error: ${errorMsg}`)
      toast.error('Failed to set value')
    }
  }

  const handleKvGet = async () => {
    try {
      const value = await spark.kv.get(kvKey)
      setKvResult(`📦 Retrieved: ${JSON.stringify(value, null, 2)}`)
      toast.success('Value retrieved successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get value'
      setKvResult(`❌ Error: ${errorMsg}`)
      toast.error('Failed to get value')
    }
  }

  const handleKvDelete = async () => {
    try {
      await spark.kv.delete(kvKey)
      setKvResult(`🗑️ Deleted "${kvKey}" successfully`)
      const keys = await spark.kv.keys()
      setKvKeys(keys)
      toast.success('Value deleted successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete value'
      setKvResult(`❌ Error: ${errorMsg}`)
      toast.error('Failed to delete value')
    }
  }

  const handleKvListKeys = async () => {
    try {
      const keys = await spark.kv.keys()
      setKvKeys(keys)
      setKvResult(`🔑 Keys: ${keys.length > 0 ? keys.join(', ') : 'No keys found'}`)
      toast.success('Keys loaded successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to list keys'
      setKvResult(`❌ Error: ${errorMsg}`)
      toast.error('Failed to list keys')
    }
  }

  // LLM operations
  const handleLlmPrompt = async () => {
    try {
      setLlmLoading(true)
      setLlmResult('Generating response...')
      
      const prompt = spark.llmPrompt`${llmPrompt}`
      const result = await spark.llm(prompt, llmModel, llmJsonMode)
      
      setLlmResult(result)
      toast.success('Response generated successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate response'
      setLlmResult(`❌ Error: ${errorMsg}`)
      toast.error('Failed to generate response')
    } finally {
      setLlmLoading(false)
    }
  }

  // User operations
  const handleGetUser = async () => {
    try {
      setUserLoading(true)
      setUserInfo('Loading user information...')
      
      const user = await spark.user()
      const formattedUser = JSON.stringify(user, null, 2)
      setUserInfo(`👤 User Information:\n${formattedUser}`)
      toast.success('User information retrieved successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get user information'
      setUserInfo(`❌ Error: ${errorMsg}`)
      toast.error('Failed to get user information')
    } finally {
      setUserLoading(false)
    }
  }

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

  const SectionHeader = ({ id, children, level = 2 }: { id: string; children: React.ReactNode; level?: 2 | 3 | 4 }) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements
    const sizeClass = level === 2 ? 'text-2xl' : level === 3 ? 'text-xl' : 'text-lg'
    
    return (
      <Tag 
        id={id}
        className={`${sizeClass} font-bold mb-4 scroll-mt-20 group flex items-center gap-2`}
      >
        <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, id)}>
          {children}
        </span>
        <button
          onClick={() => navigateToSection(activeSection, id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
          aria-label={`Link to ${children}`}
          title="Copy link to this section"
        >
          <Link size={level === 2 ? 20 : level === 3 ? 18 : 16} className="text-muted-foreground hover:text-primary" />
        </button>
      </Tag>
    )
  }

  const LinkableTitle = ({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) => {
    return (
      <div 
        id={id}
        className={`scroll-mt-20 group flex items-center gap-2 ${className}`}
      >
        <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, id)}>
          {children}
        </span>
        <button
          onClick={() => navigateToSection(activeSection, id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
          aria-label={`Link to ${children}`}
          title="Copy link to this section"
        >
          <Link size={18} className="text-muted-foreground hover:text-primary" />
        </button>
      </div>
    )
  }

  const LinkableCardTitle = ({ id, children }: { id: string; children: React.ReactNode }) => {
    return (
      <CardTitle 
        id={id}
        className="scroll-mt-20 group flex items-center gap-2"
      >
        <span className="cursor-pointer hover:text-primary transition-colors flex items-center gap-2" onClick={() => navigateToSection(activeSection, id)}>
          {children}
        </span>
        <button
          onClick={() => navigateToSection(activeSection, id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
          aria-label={`Link to ${children}`}
          title="Copy link to this section"
        >
          <Link size={18} className="text-muted-foreground hover:text-primary" />
        </button>
      </CardTitle>
    )
  }

  const sections: Section[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <Sparkle size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Unofficial Documentation for Spark</h1>
            <p className="text-lg text-muted-foreground mb-4">
              Comprehensive guide to building applications with the Spark platform
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This is the unofficial documentation for <a href="https://github.com/features/spark" className="text-primary underline hover:no-underline">GitHub Spark</a>. See <a href="https://github.com/simonw/system-exploration-g/" className="text-primary underline hover:no-underline">this repo</a> for more about this project.
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
            <SectionHeader id="persistence-api">Persistence API</SectionHeader>
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
                  <LinkableCardTitle id="usekv-hook">
                    useKV Hook <Badge variant="secondary">Recommended</Badge>
                  </LinkableCardTitle>
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
                  <LinkableCardTitle id="direct-api">Direct API</LinkableCardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Direct access to the key-value store for non-React contexts.</p>
                  
                  <CodeBlock
                    id="direct-api-methods"
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
            <SectionHeader id="llm-api">LLM API</SectionHeader>
            <p className="text-muted-foreground mb-6">
              Direct access to language models for AI-powered features in your applications.
            </p>
          </div>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="creating-prompts">Creating Prompts</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-600 font-medium">⚠️ ALL prompts MUST be created using spark.llmPrompt!</p>
              
              <CodeBlock
                id="llm-prompt-creation"
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
              <LinkableCardTitle id="executing-llm-calls">Executing LLM Calls</LinkableCardTitle>
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
                id="llm-execution-basic"
                title="Basic Execution"
                code={`const result = await spark.llm(prompt)
const jsonResult = await spark.llm(prompt, "gpt-4o-mini", true)`}
              />
              
              <CodeBlock
                id="llm-complete-example"
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
            <SectionHeader id="user-api">User API</SectionHeader>
            <p className="text-muted-foreground mb-6">
              Access current user information and implement owner-only features.
            </p>
          </div>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="user-information">User Information</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="user-basic"
                title="Get User Info"
                code={`const user = await spark.user()
// Returns: { avatarUrl, email, id, isOwner, login }`}
              />
              
              <p className="text-sm text-muted-foreground">
                Try the interactive playground above to see live user data, or use the examples below in your own code.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'playground',
      title: 'Playground',
      icon: <Play size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <SectionHeader id="interactive-playground">Interactive Playground</SectionHeader>
            <p className="text-muted-foreground mb-6">
              Experiment with the Spark APIs directly in your browser. Test KV storage operations and LLM prompting.
            </p>
          </div>

          <Tabs defaultValue="kv" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="kv">KV Store</TabsTrigger>
              <TabsTrigger value="llm">LLM API</TabsTrigger>
              <TabsTrigger value="user">User API</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kv" className="space-y-6">
              <Card>
                <CardHeader>
                  <LinkableCardTitle id="kv-store-playground">
                    <Database size={20} />
                    Key-Value Store Playground
                  </LinkableCardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="kv-key">Key</Label>
                        <Input
                          id="kv-key"
                          value={kvKey}
                          onChange={(e) => setKvKey(e.target.value)}
                          placeholder="Enter key name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="kv-value">Value (JSON)</Label>
                        <Textarea
                          id="kv-value"
                          value={kvValue}
                          onChange={(e) => setKvValue(e.target.value)}
                          placeholder='{"example": "value"}'
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleKvSet} variant="default">
                          Set Value
                        </Button>
                        <Button onClick={handleKvGet} variant="outline">
                          Get Value
                        </Button>
                        <Button onClick={handleKvDelete} variant="destructive">
                          Delete Key
                        </Button>
                        <Button onClick={handleKvListKeys} variant="secondary">
                          List Keys
                        </Button>
                      </div>
                      
                      {kvKeys.length > 0 && (
                        <div>
                          <Label>Existing Keys (click to select)</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {kvKeys.map((key) => (
                              <Badge
                                key={key}
                                variant={key === kvKey ? "default" : "secondary"}
                                className="cursor-pointer"
                                onClick={() => setKvKey(key)}
                              >
                                {key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label>Result</Label>
                      <div className="bg-muted rounded-lg p-4 min-h-[200px] mt-2">
                        <pre className="text-sm whitespace-pre-wrap">
                          {kvResult || 'No operations performed yet'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="llm" className="space-y-6">
              <Card>
                <CardHeader>
                  <LinkableCardTitle id="llm-api-playground">
                    <Code size={20} />
                    LLM API Playground
                  </LinkableCardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="llm-prompt">Prompt</Label>
                        <Textarea
                          id="llm-prompt"
                          value={llmPrompt}
                          onChange={(e) => setLlmPrompt(e.target.value)}
                          placeholder="Enter your prompt here..."
                          rows={6}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="llm-model">Model</Label>
                          <Select value={llmModel} onValueChange={setLlmModel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                              <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-end">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={llmJsonMode}
                              onChange={(e) => setLlmJsonMode(e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm">JSON Mode</span>
                          </label>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleLlmPrompt} 
                        disabled={llmLoading || !llmPrompt.trim()}
                        className="w-full"
                      >
                        {llmLoading ? 'Generating...' : 'Generate Response'}
                      </Button>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>Tip:</strong> Use variables in your prompt for dynamic content</p>
                        <p><strong>Example:</strong> "Explain ${'{topic}'} in simple terms"</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Response</Label>
                      <div className="bg-muted rounded-lg p-4 min-h-[300px] mt-2 relative">
                        <pre className="text-sm whitespace-pre-wrap">
                          {llmResult || 'No prompts executed yet'}
                        </pre>
                        {llmResult && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(llmResult, 'llm-response')}
                          >
                            {copiedCode === 'llm-response' ? <Check size={16} /> : <Copy size={16} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <LinkableCardTitle id="example-prompts">Example Prompts</LinkableCardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Text Generation</h4>
                      <div className="space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => setLlmPrompt('Write a creative story about a time-traveling developer who accidentally breaks the internet')}
                        >
                          Creative Story
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => setLlmPrompt('Explain quantum computing in simple terms that a 10-year-old could understand')}
                        >
                          Simple Explanation
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Structured Data (JSON Mode)</h4>
                      <div className="space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => {
                            setLlmPrompt('Generate a todo list for learning React with 5 tasks. Return as JSON with id, title, description, and difficulty fields.')
                            setLlmJsonMode(true)
                          }}
                        >
                          Todo List JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => {
                            setLlmPrompt('Create a user profile object with name, email, skills array, and preferences object. Return as valid JSON.')
                            setLlmJsonMode(true)
                          }}
                        >
                          User Profile JSON
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="user" className="space-y-6">
              <Card>
                <CardHeader>
                  <LinkableCardTitle id="user-api-playground">
                    <User size={20} />
                    User API Playground
                  </LinkableCardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get information about the current GitHub user, including avatar, email, login, and owner status.
                        </p>
                        
                        <Button 
                          onClick={handleGetUser} 
                          disabled={userLoading}
                          className="w-full"
                        >
                          {userLoading ? 'Loading...' : 'Get User Information'}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>User Properties:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• <code>avatarUrl</code> - GitHub profile picture URL</li>
                          <li>• <code>email</code> - User's email address</li>
                          <li>• <code>id</code> - Unique user identifier</li>
                          <li>• <code>login</code> - GitHub username</li>
                          <li>• <code>isOwner</code> - Whether user owns this app</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <Label>User Information</Label>
                      <div className="bg-muted rounded-lg p-4 min-h-[200px] mt-2 relative">
                        <pre className="text-sm whitespace-pre-wrap">
                          {userInfo || 'No user information retrieved yet'}
                        </pre>
                        {userInfo && !userLoading && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(userInfo, 'user-info')}
                          >
                            {copiedCode === 'user-info' ? <Check size={16} /> : <Copy size={16} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <LinkableCardTitle id="user-example-use-cases">Example Use Cases</LinkableCardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Conditional Features</h4>
                      <CodeBlock
                        id="user-conditional-example"
                        code={`const user = await spark.user()
if (user.isOwner) {
  // Show admin panel
  showAdminFeatures()
} else {
  // Show regular features
  showUserFeatures()
}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">User Display</h4>
                      <CodeBlock
                        id="user-display-example"
                        code={`const user = await spark.user()

return (
  <div className="flex items-center gap-2">
    <img 
      src={user.avatarUrl} 
      alt="Avatar" 
      className="w-8 h-8 rounded-full" 
    />
    <span>{user.login}</span>
    {user.isOwner && <Badge>Owner</Badge>}
  </div>
)`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
            <SectionHeader id="system-prompt">Complete System Prompt</SectionHeader>
            <p className="text-muted-foreground mb-6">
              The full system prompt that defines how Spark agents work and what capabilities they have.
            </p>
          </div>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="template-structure">Template Structure</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Every Spark app starts with this optimized template structure:</p>
              
              <CodeBlock
                id="template-structure-code"
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
│   │   └─��� utils.ts    // Utilities with shadcn class helper
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
              <LinkableCardTitle id="coding-standards">Coding Standards</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 id="element-ids" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'element-ids')}>Element IDs</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'element-ids')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Element IDs"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Use descriptive kebab-case IDs for state persistence</p>
                  <CodeBlock
                    id="element-ids-code"
                    code={`<input id="first-name" />
<input id="email-address" />
<textarea id="message-content" />`}
                  />
                </div>

                <div>
                  <h4 id="imports" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'imports')}>Imports</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'imports')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Imports"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Import by package name only, no versions or CDN URLs</p>
                  <CodeBlock
                    id="imports-code"
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
                  <h4 id="data-persistence-rules" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'data-persistence-rules')}>Data Persistence Rules</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'data-persistence-rules')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Data Persistence Rules"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2">
                    <p className="text-sm font-medium text-yellow-800">Simple Rule: "Should this survive a page refresh?"</p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• If YES → use <code>useKV</code></li>
                      <li>• If NO → use <code>useState</code></li>
                    </ul>
                  </div>
                  <CodeBlock
                    id="persistence-rules-code"
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
                  <h4 id="asset-management" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'asset-management')}>Asset Management</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'asset-management')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Asset Management"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Always import assets explicitly, never use string paths</p>
                  <CodeBlock
                    id="asset-imports-code"
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
              <LinkableCardTitle id="ui-styling-guidelines">UI & Styling Guidelines</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 id="component-library" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'component-library')}>Component Library</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'component-library')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Component Library"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Strongly prefer shadcn components over plain HTML</p>
                  <CodeBlock
                    id="shadcn-components-code"
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
                  <h4 id="styling-with-tailwind" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'styling-with-tailwind')}>Styling with Tailwind</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'styling-with-tailwind')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Styling with Tailwind"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Use utility classes and theme variables</p>
                  <CodeBlock
                    id="tailwind-styling-code"
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
                  <h4 id="icons" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'icons')}>Icons</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'icons')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Icons"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Use Phosphor Icons with default size and weight</p>
                  <CodeBlock
                    id="icons-code"
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
              <LinkableCardTitle id="available-libraries">Available Libraries</LinkableCardTitle>
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

          <Card>
            <CardHeader>
              <LinkableCardTitle id="full-system-prompt">
                <Download size={20} />
                Full System Prompt
              </LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The complete system prompt that defines how Spark agents work, including all capabilities, 
                tools, and guidelines. This is the exact text that instructs the AI on how to build applications.
              </p>
              
              {systemPromptText && !systemPromptLoading && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(systemPromptText, 'system-prompt')}
                  >
                    {copiedCode === 'system-prompt' ? <Check size={16} /> : <Copy size={16} />}
                    Copy System Prompt
                  </Button>
                  {toolsText && !toolsLoading && (
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(toolsText, 'tools-prompt')}
                    >
                      {copiedCode === 'tools-prompt' ? <Check size={16} /> : <Copy size={16} />}
                      Copy Tools
                    </Button>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h4 id="system-prompt-content" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'system-prompt-content')}>System Prompt Content</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'system-prompt-content')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to System Prompt Content"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <div className="bg-muted rounded-lg p-4 relative">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {systemPromptLoading ? 'Loading...' : systemPromptText}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 id="available-tools" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'available-tools')}>Available Tools</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'available-tools')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Available Tools"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <div className="bg-muted rounded-lg p-4 relative">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {toolsLoading ? 'Loading...' : toolsText}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'platform',
      title: 'Platform',
      icon: <Monitor size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <SectionHeader id="platform-information">Platform Information</SectionHeader>
            <p className="text-muted-foreground mb-6">
              Details about the Spark platform environment, system specifications, and runtime environment.
            </p>
          </div>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="system-information">System Information</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Operating System</h4>
                    <p className="font-mono text-sm">Debian GNU/Linux 12 (bookworm)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Kernel Version</h4>
                    <p className="font-mono text-sm">6.8.0-1027-azure</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Architecture</h4>
                    <p className="font-mono text-sm">x86_64 (64-bit)</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Processor</h4>
                    <p className="font-mono text-sm">AMD EPYC 7763 64-Core</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">CPU Cores Available</h4>
                    <p className="font-mono text-sm">4 cores</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Platform</h4>
                    <p className="font-mono text-sm">Azure Cloud (GitHub Codespaces)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="memory-storage">Memory & Storage</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Total Memory</h4>
                    <p className="font-mono text-sm">15 GB</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Available Memory</h4>
                    <p className="font-mono text-sm">~9.8 GB available</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Swap Space</h4>
                    <p className="font-mono text-sm">None configured</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Disk Space Total</h4>
                    <p className="font-mono text-sm">31 GB</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Disk Space Available</h4>
                    <p className="font-mono text-sm">27 GB free</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Disk Usage</h4>
                    <p className="font-mono text-sm">10% used (2.7 GB)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="spark-runtime-environment">Spark Runtime Environment</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Framework</h4>
                    <p>React with TypeScript</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Build Tool</h4>
                    <p>Vite (optimized for fast development)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Component Library</h4>
                    <p>shadcn/ui v4 (40+ preinstalled components)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Styling</h4>
                    <p>Tailwind CSS with custom theme variables</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Icons</h4>
                    <p>Phosphor Icons React</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Persistence</h4>
                    <p>KV Store with React hooks</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">AI Integration</h4>
                    <p>Direct LLM API access (GPT-4o, GPT-4o-mini)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">User Context</h4>
                    <p>GitHub authentication & user info</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="development-environment">Development Environment</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Container Platform</h4>
                    <p>GitHub Codespaces</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Cloud Provider</h4>
                    <p>Microsoft Azure</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">File System</h4>
                    <p>Overlay FS (container optimized)</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Package Manager</h4>
                    <p>npm (restricted to isomorphic packages)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Build Target</h4>
                    <p>Browser-compatible applications only</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Security Model</h4>
                    <p>Sandboxed execution environment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="platform-capabilities-limitations">Platform Capabilities & Limitations</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 id="supported-features" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'supported-features')}>✅ Supported Features</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'supported-features')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Supported Features"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• React applications with TypeScript</li>
                    <li>• Client-side state management with persistence</li>
                    <li>• Direct LLM API integration</li>
                    <li>• GitHub user authentication context</li>
                    <li>• Browser-compatible libraries (D3, Three.js, etc.)</li>
                    <li>• Real-time UI updates and animations</li>
                    <li>• Responsive design patterns</li>
                    <li>• Asset management (images, videos, audio)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 id="platform-limitations" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'platform-limitations')}>❌ Platform Limitations</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'platform-limitations')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Platform Limitations"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• No server-side execution (Node.js APIs)</li>
                    <li>• No database connections</li>
                    <li>• No file system access beyond assets</li>
                    <li>• No network server capabilities</li>
                    <li>• No external API calls (except through LLM proxy)</li>
                    <li>• No local storage persistence (use KV store instead)</li>
                    <li>• No privileged system operations</li>
                  </ul>
                </div>
                
                <div>
                  <h4 id="optimization-focus" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'optimization-focus')}>🎯 Optimization Focus</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'optimization-focus')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Optimization Focus"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Fast hot module replacement (HMR)</li>
                    <li>• Minimal bundle sizes</li>
                    <li>• Tree-shaking for unused code</li>
                    <li>• Optimized for micro-applications</li>
                    <li>• Progressive enhancement patterns</li>
                    <li>• Mobile-first responsive design</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="performance-characteristics">Performance Characteristics</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Cold Start Time</h4>
                    <p className="text-sm">~2-3 seconds (Vite dev server)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Hot Reload</h4>
                    <p className="text-sm">&lt;100ms (React Fast Refresh)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Build Time</h4>
                    <p className="text-sm">~5-15 seconds (typical app)</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Memory Usage</h4>
                    <p className="text-sm">~100-500MB (per app instance)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Bundle Size</h4>
                    <p className="text-sm">~200-800KB (gzipped, typical)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">KV Operations</h4>
                    <p className="text-sm">&lt;10ms (local storage backed)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="available-system-tools">Available System Tools</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Complete list of binary tools available in the PATH for development and system operations:
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs font-mono leading-relaxed break-all">
                  accessdb, aclocal-1.16, add-shell, addgnupghome, addpart, adduser, agetty, animate-im6.q16, applygnupgdefaults, apt, apt-cache, apt-cdrom, apt-config, apt-extracttemplates, apt-ftparchive, apt-get, apt-key, apt-mark, apt-sortpkgs, arch, arp, arpd, autoconf, autoheader, autom4te, automake-1.16, autoreconf, autoscan, autoupdate, azcopy, b2sum, badblocks, base32, base64, basename, basenc, bash, bashbug, blkdiscard, blkid, blkzone, blockdev, bridge, bunzip2, bzcat, bzdiff, bzexe, bzgrep, bzip2, bzip2recover, bzmore, c89-gcc, c99-gcc, c_rehash, capsh, cat, catman, chage, chattr, chcon, chcpu, chfn, chg, chgpasswd, chgrp, chmem, chmod, choom, chown, chpasswd, chroot, chrt, chsh, cksum, clear, clear_console, cmp, code, col, colcrt, colrm, column, comm, compare-im6.q16, compile_et, composite-im6.q16, conjure-im6.q16, convert-im6.q16, corelist, cp, cpan, cpan5.36-x86_64-linux-gnu, cppw, csplit, ctrlaltdel, curl, curl-config, cut, cvtsudoers, dash, date, dcb, dd, deb-systemd-helper, deb-systemd-invoke, debconf, debconf-apt-progress, debconf-communicate, debconf-copydb, debconf-escape, debconf-set-selections, debconf-show, debugfs, delpart, deluser, deploy.sh, derb, devcontainer-info, devlink, df, dh_autotools-dev_restoreconfig, dh_autotools-dev_updateconfig, dh_bash-completion, dialog, diff, diff3, dir, dircolors, dirmngr, dirmngr-client, dirname, display-im6.q16, dmesg, docker-entrypoint.sh, dpkg, dpkg-architecture, dpkg-buildflags, dpkg-buildpackage, dpkg-checkbuilddeps, dpkg-deb, dpkg-distaddfile, dpkg-divert, dpkg-fsys-usrunmess, dpkg-genbuildinfo, dpkg-genchanges, dpkg-gencontrol, dpkg-gensymbols, dpkg-maintscript-helper, dpkg-mergechangelogs, dpkg-name, dpkg-parsechangelog, dpkg-preconfigure, dpkg-query, dpkg-realpath, dpkg-reconfigure, dpkg-scanpackages, dpkg-scansources, dpkg-shlibdeps, dpkg-source, dpkg-split, dpkg-statoverride, dpkg-trigger, dpkg-vendor, du, dumpe2fs, e2freefrag, e2fsck, e2image, e2scrub, e2scrub_all, e2undo, e4crypt, e4defrag, echo, echo_supervisord_conf, egrep, enc2xs, encguess, env, envsubst, eqn, escapesrc, expand, expiry, expr, factor, faillock, faillog, fallocate, false, fc-cache, fc-cat, fc-conflist, fc-list, fc-match, fc-pattern, fc-query, fc-scan, fc-validate, fgrep, file, filefrag, fincore, find, findfs, findmnt, flock, fmt, fold, free, fsck, fsck.cramfs, fsck.minix, fsfreeze, fsnotifywait, fsnotifywatch, fstab-decode, fstrim, funzip, fuser, gapplication, gdbus, gdbus-codegen, gdk-pixbuf-csource, gdk-pixbuf-pixdata, gdk-pixbuf-thumbnailer, genbrk, gencat, genccode, gencfu, gencmn, gencnval, gendict, genl, gennorm2, genrb, gensprep, getcap, getconf, getent, getopt, getpcaps, gettext, gettext.sh, gettextize, gh, gio, git, git-cvsserver, git-receive-pack, git-shell, git-upload-archive, git-upload-pack, gitk, glib-compile-resources, glib-genmarshal, glib-gettextize, glib-mkenums, gobject-query, gpasswd, gpg, gpg-agent, gpg-connect-agent, gpg-wks-server, gpg-zip, gpgcompose, gpgconf, gpgparsemail, gpgsm, gpgsplit, gpgtar, gpgv, grep, gresource, groff, grog, grops, grotty, groupadd, groupdel, groupmems, groupmod, groups, grpck, grpconv, grpunconv, gsettings, gtester, gtester-report, gunzip, gzexe, gzip, h2ph, h2xs, hardlink, head, helpztags, hexdump, hg, hg-ssh, hostid, hostname, htop, hwclock, hydrate.sh, iconv, iconvconfig, icuexportdata, icuinfo, icupkg, id, identify-im6.q16, ifconfig, ifnames, import-im6.q16, infocmp, inotifywait, inotifywatch, install, installkernel, instmodsh, invoke-rc.d, ionice, ip, ipcmk, ipcrm, ipcs, ipmaddr, iptunnel, ischroot, isosize, join, jq, json_pp, kbxutil, kill, killall, killall5, krb5-config.mit, last, lastlog, lcf, ldattach, ldconfig, ldd, less, lessecho, lesskey, lesspipe, lexgrog, libnetcfg, libpng16-config, libtoolize, libwmf-config, link, ln, lnstat, locale, locale-gen, localedef, logger, login, logname, logsave, look, losetup, ls, lsattr, lsb_release, lsblk, lscpu, lsfd, lsipc, lsirq, lslocks, lslogins, lsmem, lsns, lsof, lspgpot, lzmainfo, m4, make, make-first-existing-target, makeconv, man, man-recode, mandb, manpath, mariadb_config, mawk, mcookie, md5sum, mesg, migrate-pubring-from-classic-gpg, mii-tool, mkdir, mke2fs, mkfifo, mkfs, mkfs.bfs, mkfs.cramfs, mkfs.minix, mkhomedir_helper, mklost+found, mknod, mkswap, mktemp, mogrify-im6.q16, montage-im6.q16, more, mount, mountpoint, msgattrib, msgcat, msgcmp, msgcomm, msgconv, msgen, msgexec, msgfilter, msgfmt, msggrep, msginit, msgmerge, msgunfmt, msguniq, mv, namei, nameif, nano, ncdu, ncurses6-config, ncursesw6-config, neqn, netstat, newgrp, newusers, ngettext, nice, nl, node, nohup, nologin, nproc, nroff, nsenter, nstat, numfmt, od, openssl, pam-auth-update, pam_getenv, pam_namespace_helper, pam_timestamp_check, partx, passwd, paste, patch, pathchk, pcre2-config, peekfd, perl, perl5.36-x86_64-linux-gnu, perl5.36.0, perlbug, perldoc, perlivp, perlthanks, pg_config, pgrep, pic, piconv, pidproxy, pidwait, pinentry-curses, pinky, pivot_root, pkgconf, pkgdata, pl2pm, pldd, plipconfig, pmap, pod2html, pod2man, pod2text, pod2usage, podchecker, policy-rc.d, post-commit, pr, preconv, printenv, printf, prlimit, prove, proxy.js, prtstat, ps, pslog, pstree, ptar, ptardiff, ptargrep, ptx, pwck, pwconv, pwd, pwdx, pwhistory_helper, pwunconv, py3clean, py3compile, pydoc3.11, pygettext3.11, python3.11, rarp, rdma, readlink, readprofile, realpath, recode-sr-latin, remove-shell, rename.ul, renice, resize2fs, resizepart, rev, rg, rgrep, rm, rmdir, rmt-tar, route, routel, rpcgen, rrsync, rsync, rsync-ssl, rtacct, rtcwake, rtmon, run-parts, runcon, runuser, savelog, scalar, scp, script, scriptlive, scriptreplay, sdiff, sed, select-editor, sensible-browser, sensible-editor, sensible-pager, seq, service, setarch, setcap, setpriv, setsid, setterm, sftp, sha1sum, sha224sum, sha256sum, sha384sum, sha512sum, shadowconfig, shasum, shred, shuf, shutdown.sh, skill, slabtop, slattach, sleep, soelim, sort, spark-designer, spark-file-syncer, spark-server, splain, split, sq, ss, ssh, ssh-add, ssh-agent, ssh-argv0, ssh-copy-id, ssh-keygen, ssh-keyscan, sshd, start-stop-daemon, stat, static-preview-build.sh, stdbuf, strace, strace-log-merge, stream-im6.q16, streamzip, stty, su, sudo, sudo_logsrvd, sudo_sendlog, sudoreplay, sulogin, sum, supervisorctl, supervisord, svn, svnadmin, svnauthz, svnauthz-validate, svnbench, svndumpfilter, svnfsfs, svnlook, svnmucc, svnrdump, svnserve, svnsync, svnversion, swaplabel, swapoff, swapon, switch_root, sync, sysctl, systemctl, tabs, tac, tail, tar, tarcat, taskset, tbl, tc, tee, tempfile, test, tic, timeout, tipc, tload, toe, top, touch, tput, tr, tree, troff, true, truncate, tset, tsort, tty, tune2fs, tzselect, ucf, ucfq, ucfr, uclampset, uconv, ul, umount, uname, uncompress, unexpand, uniq, unix_chkpwd, unix_update, unlink, unshare, unzip, unzipsfx, update-alternatives, update-ca-certificates, update-locale, update-mime-database, update-passwd, update-rc.d, update-shells, upload-to-remote.sh, uptime, useradd, userdel, usermod, users, utmpdump, validlocale, vdir, vdpa, vim.tiny, vipw, visudo, vmstat, w, wall, watch, watchgnupg, wc, wdctl, wget, whatis, whereis, which.debianutils, who, whoami, wipefs, write, x86_64-linux-gnu-addr2line, x86_64-linux-gnu-ar, x86_64-linux-gnu-as, x86_64-linux-gnu-c++filt, x86_64-linux-gnu-cpp-12, x86_64-linux-gnu-dwp, x86_64-linux-gnu-elfedit, x86_64-linux-gnu-g++-12, x86_64-linux-gnu-gcc-12, x86_64-linux-gnu-gcc-ar-12, x86_64-linux-gnu-gcc-nm-12, x86_64-linux-gnu-gcc-ranlib-12, x86_64-linux-gnu-gcov-12, x86_64-linux-gnu-gcov-dump-12, x86_64-linux-gnu-gcov-tool-12, x86_64-linux-gnu-gp-archive, x86_64-linux-gnu-gp-collect-app, x86_64-linux-gnu-gp-display-html, x86_64-linux-gnu-gp-display-src, x86_64-linux-gnu-gp-display-text, x86_64-linux-gnu-gprof, x86_64-linux-gnu-gprofng, x86_64-linux-gnu-ld.bfd, x86_64-linux-gnu-ld.gold, x86_64-linux-gnu-lto-dump-12, x86_64-linux-gnu-nm, x86_64-linux-gnu-objcopy, x86_64-linux-gnu-objdump, x86_64-linux-gnu-ranlib, x86_64-linux-gnu-readelf, x86_64-linux-gnu-size, x86_64-linux-gnu-strings, x86_64-linux-gnu-strip, xargs, xgettext, xml2-config, xslt-config, xsubpp, xz, xzdiff, xzgrep, xzless, xzmore, yes, zcat, zcmp, zdiff, zdump, zegrep, zfgrep, zforce, zgrep, zic, zip, zipcloak, zipdetails, zipgrep, zipinfo, zipnote, zipsplit, zless, zmore, znew, zramctl, zsh, zsh5
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 id="key-development-tools" className="font-semibold text-sm text-muted-foreground mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'key-development-tools')}>Key Development Tools</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'key-development-tools')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Key Development Tools"
                      title="Copy link to this section"
                    >
                      <Link size={14} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• <code>node</code> - Node.js runtime</li>
                    <li>• <code>git</code> - Version control</li>
                    <li>• <code>gh</code> - GitHub CLI</li>
                    <li>• <code>code</code> - VS Code</li>
                    <li>• <code>curl</code>, <code>wget</code> - HTTP clients</li>
                    <li>• <code>jq</code> - JSON processor</li>
                    <li>• <code>docker-entrypoint.sh</code> - Container tools</li>
                  </ul>
                </div>
                <div>
                  <h4 id="system-utilities" className="font-semibold text-sm text-muted-foreground mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'system-utilities')}>System Utilities</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'system-utilities')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to System Utilities"
                      title="Copy link to this section"
                    >
                      <Link size={14} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• <code>bash</code>, <code>zsh</code> - Shell environments</li>
                    <li>• <code>grep</code>, <code>sed</code>, <code>awk</code> - Text processing</li>
                    <li>• <code>find</code>, <code>tree</code> - File system navigation</li>
                    <li>• <code>htop</code>, <code>ps</code> - Process monitoring</li>
                    <li>• <code>tar</code>, <code>gzip</code>, <code>zip</code> - Archive tools</li>
                    <li>• <code>systemctl</code> - Service management</li>
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
            <SectionHeader id="best-practices">Best Practices</SectionHeader>
            <p className="text-muted-foreground mb-6">
              Essential patterns and recommendations for building high-quality Spark applications.
            </p>
          </div>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="state-management">State Management</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 id="functional-updates-usekv" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'functional-updates-usekv')}>Functional Updates with useKV</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'functional-updates-usekv')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Functional Updates with useKV"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Always use functional updates to avoid stale closure issues</p>
                  <CodeBlock
                    id="functional-updates-code"
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
                  <h4 id="choosing-usestate-usekv" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'choosing-usestate-usekv')}>Choosing Between useState and useKV</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'choosing-usestate-usekv')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Choosing Between useState and useKV"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <CodeBlock
                    id="state-choice-code"
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
              <LinkableCardTitle id="error-handling">Error Handling</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="llm-error-handling"
                title="LLM API Error Handling"
                code={`const generateContent = async (topic: string) => {
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
                id="kv-error-handling-code"
                title="KV Storage Error Handling"
                code={`const saveData = async () => {
  try {
    await spark.kv.set("user-data", userData)
    toast.success("Data saved successfully!")
  } catch (error) {
    console.error("Failed to save data:", error)
    toast.error("Failed to save data. Please try again.")
  }
}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LinkableCardTitle id="performance-tips">Performance Tips</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 id="efficient-re-renders" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'efficient-re-renders')}>Efficient Re-renders</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'efficient-re-renders')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Efficient Re-renders"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <CodeBlock
                    id="performance-tips-code"
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
                  <h4 id="optimizing-kv-operations" className="font-semibold mb-2 scroll-mt-20 group flex items-center gap-2">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToSection(activeSection, 'optimizing-kv-operations')}>Optimizing KV Operations</span>
                    <button
                      onClick={() => navigateToSection(activeSection, 'optimizing-kv-operations')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      aria-label="Link to Optimizing KV Operations"
                      title="Copy link to this section"
                    >
                      <Link size={16} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </h4>
                  <CodeBlock
                    id="kv-optimization-code"
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
              <LinkableCardTitle id="accessibility">Accessibility</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="accessibility-code"
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
              <LinkableCardTitle id="mobile-responsiveness">Mobile Responsiveness</LinkableCardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="mobile-responsive-code"
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
            <CardContent className="space-y-4">
              <CodeBlock
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

  const activeContent = sections.find(s => s.id === activeSection)?.content

  const SidebarContent = () => (
    <div className="w-64 bg-card border-r border-border p-4 min-h-screen">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Spark Docs</h2>
      </div>
      
      <nav className="space-y-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => navigateToSection(section.id)}
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