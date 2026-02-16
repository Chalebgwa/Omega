import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Omega</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/public" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md">
                Soap Box
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md">
                Login
              </Link>
              <Link href="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Your Legacy, Your Words
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create meaningful messages and video recordings for your loved ones.
            Share your thoughts, memories, and wisdom that will last forever.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-4xl mb-4">✍️</div>
                <h3 className="text-xl font-semibold mb-2">Personal Messages</h3>
                <p className="text-gray-600">
                  Write or record video messages for specific individuals
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-4xl mb-4">📔</div>
                <h3 className="text-xl font-semibold mb-2">Journal Entries</h3>
                <p className="text-gray-600">
                  Add entries over time with customizable intervals
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-4xl mb-4">📢</div>
                <h3 className="text-xl font-semibold mb-2">Soap Box</h3>
                <p className="text-gray-600">
                  Share public thoughts and messages with the world
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <Link 
              href="/register" 
              className="inline-block bg-blue-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">
            © 2024 Omega. Something personal for the people I care about.
          </p>
        </div>
      </footer>
    </main>
  )
}
