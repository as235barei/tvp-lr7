import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import BackToTop from './BackToTop';

// Map a route to the prototype's <body class="page-*"> so the original CSS
// page layouts keep working in the React app.
function pageClass(pathname) {
  if (pathname === '/') return 'page-home';
  if (pathname.startsWith('/catalog')) return 'page-catalog';
  if (pathname.startsWith('/product')) return 'page-product';
  if (pathname.startsWith('/cart')) return 'page-cart';
  if (pathname.startsWith('/checkout')) return 'page-checkout';
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return 'page-auth';
  if (pathname.startsWith('/account')) return 'page-account';
  return 'page-home';
}

// App shell shared by every store page: header, routed page content, footer
// and the floating "back to top" button. Scrolls to top on route change.
export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.body.className = pageClass(pathname);
  }, [pathname]);

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
