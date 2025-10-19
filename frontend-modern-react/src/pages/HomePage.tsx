import { useFeaturedTours, usePopularTours } from '../lib/hooks/useTours'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatPrice } from '../lib/utils'
import { MapPin, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const { data: featuredTours, isLoading: loadingFeatured } = useFeaturedTours()
  const { data: popularTours, isLoading: loadingPopular } = usePopularTours()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Hayalinizdeki Tatili Keşfedin
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Türkiye'nin en güzel yerlerinde unutulmaz anılar biriktirin
          </p>
          <Link to="/tours">
            <Button size="lg" className="text-lg px-8 py-6">
              Turları İncele
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Öne Çıkan Turlar</h2>
          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTours?.data?.slice(0, 6).map((tour) => (
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
                    <CardTitle className="text-xl mb-2">{tour.title}</CardTitle>
                    <CardDescription className="mb-4">
                      {tour.short_description}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {tour.location}
                      </div>
                      {tour.duration_days && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {tour.duration_days} gün
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(tour.base_price || 0)}
                    </span>
                    <Link to={`/tours/${tour.id}`}>
                      <Button>Detaylar</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Tours */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Popüler Turlar</h2>
          {loadingPopular ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularTours?.data?.slice(0, 4).map((tour) => (
                <Link key={tour.id} to={`/tours/${tour.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="p-0">
                      <div className="h-40 bg-gray-300 rounded-t-lg overflow-hidden">
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
                      <CardTitle className="text-lg mb-2">{tour.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="h-3 w-3" />
                        {tour.location}
                      </div>
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(tour.base_price || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Hemen Rezervasyon Yapın
          </h2>
          <p className="text-xl mb-8">
            En iyi fiyatları kaçırmayın!
          </p>
          <Link to="/tours">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Tüm Turları Gör
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
