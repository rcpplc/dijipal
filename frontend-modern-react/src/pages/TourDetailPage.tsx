import { useParams } from 'react-router-dom'
import { useTour, useTourDates } from '../lib/hooks/useTours'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { formatPrice, formatDate } from '../lib/utils'
import { MapPin, Clock, Users, Calendar, Check, X } from 'lucide-react'

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: tour, isLoading } = useTour(id!)
  const { data: tourDates, isLoading: loadingDates } = useTourDates(id!)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!tour?.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">Tur bulunamadı</h1>
        </div>
      </div>
    )
  }

  const tourData = tour.data

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Image Gallery */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tourData.images[0] && (
              <div className="h-96 rounded-lg overflow-hidden">
                <img
                  src={tourData.images[0]}
                  alt={tourData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {tourData.images.slice(1, 5).map((image, i) => (
                <div key={i} className="h-44 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`${tourData.title} ${i + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{tourData.title}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  {tourData.location}
                </div>
                {tourData.duration_days && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-5 w-5" />
                    {tourData.duration_days} gün
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-5 w-5" />
                  {tourData.max_participants} kişi
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tur Hakkında</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{tourData.description}</p>
              </CardContent>
            </Card>

            {tourData.program_details && (
              <Card>
                <CardHeader>
                  <CardTitle>Program Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {tourData.program_details}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tourData.included_services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dahil Olan Hizmetler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tourData.included_services.map((service, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {tourData.excluded_services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dahil Olmayan Hizmetler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tourData.excluded_services.map((service, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fiyat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 mb-4">
                  {formatPrice(tourData.base_price || 0)}
                </p>
                <Button className="w-full" size="lg">
                  Rezervasyon Yap
                </Button>
              </CardContent>
            </Card>

            {!loadingDates && tourDates?.data && tourDates.data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Müsait Tarihler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tourDates.data.slice(0, 5).map((date) => (
                      <div
                        key={date.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">{formatDate(date.start_date)}</span>
                        </div>
                        {date.is_active && (
                          <span className="text-xs text-green-600 font-medium">
                            Müsait
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {tourData.cancellation_policy && (
              <Card>
                <CardHeader>
                  <CardTitle>İptal Politikası</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {tourData.cancellation_policy}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
