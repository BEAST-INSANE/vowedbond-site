export default function BellaItaliaDemo() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold">Bella Italia</h1>

        <div className="flex gap-6 text-sm font-medium">
          <a href="#">Home</a>
          <a href="#">Menu</a>
          <a href="#">Reservations</a>
          <a href="#">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="uppercase tracking-[0.25em] text-red-600 text-sm font-semibold">
              Authentic Italian Cuisine
            </p>

            <h2 className="text-5xl font-bold leading-tight mt-4">
              Fresh Italian Food
              <br />
              Made Every Day
            </h2>

            <p className="mt-6 text-gray-600 text-lg">
              Enjoy handcrafted pizzas, fresh pasta and traditional
              Italian recipes prepared daily by our chefs.
            </p>

            <button className="mt-8 bg-red-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-700 transition">
              Reserve a Table
            </button>
          </div>

          <div>
            <img
              src="/pizza.jpg"
              alt="Bella Italia Pizza"
              className="w-full h-[450px] object-cover rounded-3xl shadow-xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}