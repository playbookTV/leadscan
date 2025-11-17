import { Card, CardBody } from '@heroui/react'

export default function KeywordsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Keywords</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage and optimize your search keywords
        </p>
      </div>
      <Card className="border-none shadow-sm">
        <CardBody className="p-12 text-center">
          <p className="text-gray-500">Keywords management coming soon...</p>
        </CardBody>
      </Card>
    </div>
  )
}
