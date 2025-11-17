import { Card, CardBody } from '@heroui/react'

export default function TemplatesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Response Templates</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Pre-written responses for quick lead outreach
        </p>
      </div>
      <Card className="border-none shadow-sm">
        <CardBody className="p-12 text-center">
          <p className="text-gray-500">Response templates coming soon...</p>
        </CardBody>
      </Card>
    </div>
  )
}
