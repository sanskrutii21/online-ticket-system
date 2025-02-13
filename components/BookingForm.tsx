import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface BookingFormProps {
  eventId: string
  eventName: string
  price: number
  availableTickets: number
}

const BookingForm = ({ eventId, eventName, price, availableTickets }: BookingFormProps) => {
  const [ticketCount, setTicketCount] = useState<string>("1")
  const [showPayButton, setShowPayButton] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)

      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session)
      })

      return () => subscription.unsubscribe()
    }

    checkAuth()
  }, [])

  // Restore booking intent after login if exists
  useEffect(() => {
    if (isAuthenticated) {
      const storedBooking = sessionStorage.getItem('bookingIntent')
      if (storedBooking) {
        const booking = JSON.parse(storedBooking)
        if (booking.eventId === eventId) {
          setTicketCount(booking.ticketCount.toString())
          setShowPayButton(true)
          sessionStorage.removeItem('bookingIntent')
        }
      }
    }
  }, [isAuthenticated, eventId])

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTicketCount(value); // Allow any input including empty string

    // Clear validation messages when input is changed
    setShowPayButton(false);
  }

  const handleBookTickets = () => {
    // Validate empty input
    if (!ticketCount.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter the number of tickets you want to book",
        variant: "destructive"
      });
      return;
    }

    const numTickets = parseInt(ticketCount);

    // Validate numeric input
    if (isNaN(numTickets) || numTickets < 1) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of tickets",
        variant: "destructive"
      });
      setTicketCount("1");
      return;
    }

    // Verify available tickets
    if (numTickets > availableTickets) {
      toast({
        title: "Booking Error",
        description: `Only ${availableTickets} tickets available`,
        variant: "destructive"
      });
      setTicketCount(availableTickets.toString());
      return;
    }

    setShowPayButton(true);
  }

  const handleProceedToCheckout = async () => {
    try {
      if (!ticketCount.trim()) {
        toast({
          title: "Invalid Input",
          description: "Please enter the number of tickets you want to book",
          variant: "destructive"
        });
        return;
      }

      const numTickets = parseInt(ticketCount);
      
      if (isNaN(numTickets) || numTickets < 1) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid number of tickets",
          variant: "destructive"
        });
        return;
      }

      // Double check authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Store booking intent and redirect to login
        sessionStorage.setItem('bookingIntent', JSON.stringify({
          eventId,
          eventName,
          ticketCount: numTickets,
          totalPrice: price * numTickets
        }))
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with your booking",
        })
        router.push('/login')
        return
      }

      // Verify tickets are still available
      const { data: eventData, error: eventError } = await supabase
        .from('event')
        .select('tickets_available')
        .eq('id', eventId)
        .single()

      if (eventError || !eventData) {
        throw new Error('Error checking ticket availability')
      }

      if (eventData.tickets_available < numTickets) {
        toast({
          title: "Booking Error",
          description: `Only ${eventData.tickets_available} tickets are now available`,
          variant: "destructive"
        })
        setTicketCount(eventData.tickets_available.toString())
        return
      }

      // Proceed to checkout
      const params = new URLSearchParams({
        eventId,
        eventName,
        tickets: numTickets.toString(),
        totalPrice: (price * numTickets).toString()
      })
      
      router.push(`/checkout?${params.toString()}`)
    } catch (error) {
      console.error("Error proceeding to checkout:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ticketCount">Number of Tickets</Label>
        <Input
          id="ticketCount"
          type="number"
          min={1}
          max={availableTickets}
          value={ticketCount}
          onChange={handleTicketChange}
          className="w-full"
          placeholder="Enter number of tickets"
        />
      </div>

      {!showPayButton ? (
        <Button 
          onClick={handleBookTickets} 
          className="w-full"
          disabled={availableTickets === 0}
        >
          Book Tickets
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-lg font-semibold">
            Total Amount: ${(price * (parseInt(ticketCount) || 0)).toFixed(2)}
          </p>
          <Button 
            onClick={handleProceedToCheckout}
            className="w-full"
          >
            Proceed to Checkout
          </Button>
        </div>
      )}
    </div>
  )
}

export default BookingForm