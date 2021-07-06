import React, { ReactNode } from "react"
import { Head, Link } from "blitz"

/* Navbar */
class Nav extends React.Component {
  render() {
    return (
      <div className="navbar">
        <h3 className="brand">Blitz App</h3>

        <div className="px-6 py-5 flex-none">
          <ul className="navlinks">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/notes">Notes</Link>
            </li>
          </ul>
        </div>
        <div className="w-1/2 ml-2 flex-initial">{""}</div>
      </div>
    )
  }
}

type LayoutProps = {
  title?: string
  children: ReactNode
}

const Layout = ({ title, children }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>{title || "fitplan"}</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Nav />

      {children}
    </>
  )
}

export default Layout
