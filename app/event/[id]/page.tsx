"use client"

import Image from "next/image"
import { notFound } from "next/navigation"
import BookingForm from "@/components/BookingForm"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  name: string
  image_url: string
  description: string
  price: number
  tickets_available: number
  address: string
  created_at: string
  eventDate: string
}

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('event')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          notFound()
        }

        setEvent(data)
      } catch (error) {
        console.error("Error fetching event:", error)
        setError("Failed to load event details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-64 w-full mb-4 rounded-lg"></div>
          <div className="bg-gray-200 h-8 w-3/4 mb-4"></div>
          <div className="bg-gray-200 h-4 w-1/4 mb-4"></div>
          <div className="bg-gray-200 h-24 w-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return notFound()
  }

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="overflow-hidden">
        <div className="relative w-full h-64">
          <Image
            src={event.image_url || "/api/placeholder/600/400"}
            alt={event.name}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
          <p className="text-gray-600 mb-4">{formattedDate}</p>
          <p className="text-xl font-semibold mb-4">${event.price.toFixed(2)}</p>
          <p className="mb-4">{event.description}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Available Tickets: {event.tickets_available}
            </p>
            <p className="text-sm text-gray-600">
              Location: {event.address}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <BookingForm
            eventId={event.id}
            eventName={event.name}
            price={event.price}
            availableTickets={event.tickets_available}
          />
        </CardFooter>
      </Card>
    </div>
  )
}