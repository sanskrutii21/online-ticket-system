"use client"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EventCardProps {
  id: string
  name: string
  imageUrl: string
  description: string
  price: number
  ticketsAvailable: number
  address: string
}

export default function EventCard({ 
  id, 
  name, 
  imageUrl, 
  description,
  price,
  ticketsAvailable,
  address 
}: EventCardProps) {
  return (
    <Card className="overflow-hidden">
      <Image
        src={imageUrl || "/placeholder.svg"}
        alt={name}
        width={300}
        height={200}
        className="w-full object-cover h-48"
      />
      <CardContent className="p-4">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-gray-600 line-clamp-2 mb-2">{description}</p>
        <p className="text-sm text-gray-500 mb-2">{address}</p>
        <div className="flex justify-between items-center">
          <p className="text-lg font-semibold text-green-600">${price.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{ticketsAvailable} tickets left</p>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/event/${id}`} passHref legacyBehavior>
          <Button className="w-full" asChild>
            <a>View Details</a>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}