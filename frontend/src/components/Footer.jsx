export default function Footer() {
  return (
    <footer className="border-t-2 border-black py-8 text-center text-sm font-serif font-medium text-gray-500 bg-gray-50">
      © {new Date().getFullYear()} zkVote
    </footer>
  )
}