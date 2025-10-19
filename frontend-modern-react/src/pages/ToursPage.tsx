import { useState } from 'react'
import { useTours } from '../lib/hooks/useTours'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatPrice } from '../lib/utils'
import { MapPin, Clock, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ToursPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useTours({
    search,
    category,
    page,
    page_size: 12,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tüm Turlar</h1>
          <p className="text-gray-600">
            {data?.data?.total || 0} tur bulundu
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tur ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Kategoriler</option>
            <option value="deniz">Deniz Turları</option>
            <option value="doga">Doğa Turları</option>
            <option value="kultur">Kültür Turları</option>
            <option value="macera">Macera Turları</option>
          </select>
        </div>

        {/* Tours Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.data?.items?.map((tour) => (
                <Card key={tour.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="h-48 bg-gray-300 rounded-t-lg overflow-hidden">
                      {tour.images[0] && (
                        <img
                          src={tour.images[0]}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {tour.title}
                    </CardTitle>
                    <CardDescription className="mb-3 line-clamp-2">
                      {tour.short_description}
                    </CardDescription>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tour.location}
                      </div>
                      {tour.duration_days && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tour.duration_days} gün
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(tour.base_price || 0)}
                    </span>
                    <Link to={`/tours/${tour.id}`}>
                      <Button size="sm">İncele</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data?.data?.total_pages && data.data.total_pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Önceki
                </Button>
                <span className="px-4 py-2 flex items-center">
                  Sayfa {page} / {data.data.total_pages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === data.data.total_pages}
                  onClick={() => setPage(page + 1)}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
