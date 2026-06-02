export default function RestaurantDemo() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Bella Italia
        </h1>

        <div className="flex gap-8 text-gray-600 font-medium">
          <a href="#">Home</a>
          <a href="#">Menu</a>
          <a href="#">Reservations</a>
          <a href="#">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Left Side */}
          <div>
            <p className="uppercase tracking-[0.25em] text-red-600 text-sm font-semibold">
              Authentic Italian Cuisine
            </p>

            <h1 className="mt-5 text-5xl md:text-7xl font-bold leading-[0.95] text-gray-900">
              Fresh Italian Food
              <br />
              Made Every Day
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              Authentic pizzas, pasta and desserts crafted
              with traditional recipes and fresh ingredients.
            </p>

            <button className="mt-8 bg-red-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-700 transition">
              Reserve a Table
            </button>
          </div>
