"use client"

import { useEffect, useState } from "react"
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link" // Import Link for navigation

interface Booking {
  id: string
  event_id: string
  booked_at: string
  tickets_booked: number
  price_paid: number
  event: {
    name: string
    image_url: string
    description: string
    eventDate: string // Event date and time
    address: string
  }
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          event:event_id (
            name,
            image_url,
            description,
            eventDate,
            address
          )
        `)
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const canCancelBooking = (eventDate: string) => {
    const eventDateTime = new Date(eventDate)
    const now = new Date()
    const hoursDifference = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursDifference >= 48
  }

  const handleCancelBooking = async (bookingId: string, eventId: string, ticketsBooked: number) => {
    try {
      const { error: cancelError } = await supabase
        .rpc('cancel_booking', {
          booking_id: bookingId,
          event_id: eventId,
          tickets_count: ticketsBooked
        })

      if (cancelError) throw cancelError

      await fetchBookings()
    } catch (error) {
      console.error('Error canceling booking:', error)
    }
  }

  const groupBookingsByStatus = (bookings: Booking[]) => {
    const now = new Date()
    return bookings.reduce(
      (acc, booking) => {
        const eventDate = new Date(booking.event.eventDate)
        if (eventDate > now) {
          acc.upcoming.push(booking)
        } else {
          acc.past.push(booking)
        }
        return acc
      },
      { upcoming: [] as Booking[], past: [] as Booking[] }
    )
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  const { upcoming, past } = groupBookingsByStatus(bookings)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Home Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Link href="/">
          <Button variant="default">Go to Home</Button>
        </Link>
      </div>

      {/* Upcoming Events Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">No upcoming bookings</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((booking) => (
              <Card key={booking.id} className="flex flex-col">
                <CardContent className="p-6">
                  <img
                    src={booking.event.image_url || "/placeholder.svg"}
                    alt={booking.event.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                  <h3 className="text-xl font-bold mb-2">{booking.event.name}</h3>
                  <p className="text-gray-600 mb-2">{booking.event.description}</p>
                  {/* Display Event Date and Time */}
                  <p className="text-sm text-gray-500 mb-2">
                    Event Date: {new Date(booking.event.eventDate).toLocaleString('en-GB')}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">{booking.event.address}</p>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm">Tickets: {booking.tickets_booked}</p>
                    <p className="text-sm">Total: ${booking.price_paid.toFixed(2)}</p>
                  </div>
                  {canCancelBooking(booking.event.eventDate) ? (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleCancelBooking(booking.id, booking.event_id, booking.tickets_booked)}
                    >
                      Cancel Booking
                    </Button>
                  ) : (
                    <p className="text-sm text-red-500">
                      Cancellation is allowed only 48 hours prior to the event.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Events Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
        {past.length === 0 ? (
          <p className="text-gray-500">No past bookings</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {past.map((booking) => (
              <Card key={booking.id} className="flex flex-col opacity-75">
                <CardContent className="p-6">
                  <img
                    src={booking.event.image_url || "/placeholder.svg"}
                    alt={booking.event.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                  <h3 className="text-xl font-bold mb-2">{booking.event.name}</h3>
                  <p className="text-gray-600 mb-2">{booking.event.description}</p>
                  {/* Display Event Date and Time */}
                  <p className="text-sm text-gray-500 mb-2">
                    Event Date: {new Date(booking.event.eventDate).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">{booking.event.address}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Tickets: {booking.tickets_booked}</p>
                    <p className="text-sm">Total: ${booking.price_paid.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}