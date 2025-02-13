// app/page.tsx
"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import EventCard from "@/components/EventCard"
import { useEffect, useState } from "react"
import { supabase } from '@/lib/supabase'
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface Event {
  id: string
  name: string
  image_url: string
  description: string
  price: number
  tickets_available: number
  address: string
  created_at: string
}

export default function Home() {
  const [userExists, setUserExists] = useState(false)
  const [userNameInitial, setUserNameInitial] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Error fetching session:", sessionError)
          return
        }

        if (session?.user) {
          setUserExists(true)
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', session.user.id)
            .single()

          if (userError) {
            console.error("Error fetching user data:", userError)
            return
          }

          if (userData?.name) {
            setUserNameInitial(userData.name.charAt(0).toUpperCase())
          } else if (userData?.email) {
            setUserNameInitial(userData.email.charAt(0).toUpperCase())
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              setUserExists(true)
              
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', session.user.id)
                .single()

              if (userData?.name) {
                setUserNameInitial(userData.name.charAt(0).toUpperCase())
              } else if (userData?.email) {
                setUserNameInitial(userData.email.charAt(0).toUpperCase())
              }
            }
            
            if (event === 'SIGNED_OUT') {
              setUserExists(false)
              setUserNameInitial("")
            }
          }
        )

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error in auth check:", error)
      }
    }

    checkUser()
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        let query = supabase
          .from('event')
          .select('*')

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setEvents(data || [])
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [searchQuery])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUserExists(false)
      setUserNameInitial("")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-bold">Event Ticketing</h1>
            </Link>
            
            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 pt-10">
                    {userExists ? (
                      <>
                        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userNameInitial}
                          </div>
                          <span className="font-medium">Profile</span>
                        </div>
                        <Link href="/my-bookings" className="w-full">
                          <Button variant="outline" className="w-full justify-start">
                            My Bookings
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          onClick={handleSignOut} 
                          className="w-full justify-start"
                        >
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="w-full">
                          <Button variant="outline" className="w-full justify-start">
                            Login
                          </Button>
                        </Link>
                        <Link href="/register" className="w-full">
                          <Button className="w-full justify-start">
                            Register
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-4">
              {userExists ? (
                <div className="flex items-center gap-4">
                  <Link href="/my-bookings">
                    <Button variant="outline">My Bookings</Button>
                  </Link>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer">
                    {userNameInitial}
                  </div>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Register</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Upcoming Events</h2>
            <div className="w-full md:w-1/3">
              <Input
                type="search"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading events...</div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  imageUrl={event.image_url}
                  description={event.description}
                  price={event.price}
                  ticketsAvailable={event.tickets_available}
                  address={event.address}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {searchQuery ? "No events found matching your search." : "No events available."}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}