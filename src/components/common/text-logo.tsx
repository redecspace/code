import Link from 'next/link'


const TextLogo = () => {
  return (
    <Link href="/" className="text-3xl font-display font-extrabold text-white">
    <span className="text-purple-400 dark:text-purple-300">Re</span>
    <span className="text-violet-500">dec.</span>
  </Link>

  )
}

export default TextLogo