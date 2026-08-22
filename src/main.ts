import './style.css'
import { setupShaderBackground } from './shader-background'

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('hero')) {
    setupShaderBackground()
  }
  setupNavbar()
  setupMobileMenu()
  setupScrollReveal()
  setupCounters()
})

function setupNavbar() {
  const navbar = document.getElementById('navbar')
  if (!navbar) return

  const onScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('navbar-scrolled')
    } else {
      navbar.classList.remove('navbar-scrolled')
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

function setupMobileMenu() {
  const btn = document.getElementById('menu-btn')
  const menu = document.getElementById('mobile-menu')
  const iconOpen = document.getElementById('icon-open')
  const iconClose = document.getElementById('icon-close')
  const mobileLinks = document.querySelectorAll('.mobile-link')

  if (!btn || !menu) return

  const openMenu = () => {
    menu.classList.add('open')
    iconOpen?.classList.add('hidden')
    iconClose?.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  }

  const closeMenu = () => {
    menu.classList.remove('open')
    iconOpen?.classList.remove('hidden')
    iconClose?.classList.add('hidden')
    document.body.style.overflow = ''
  }

  btn.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu()
  })

  mobileLinks.forEach(link => link.addEventListener('click', closeMenu))
}

function setupScrollReveal() {
  const elements = document.querySelectorAll<HTMLElement>('.reveal')

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const delay = el.style.transitionDelay || '0s'
          setTimeout(() => {
            el.classList.add('visible')
          }, parseFloat(delay) * 1000)
          observer.unobserve(el)
        }
      })
    },
    { threshold: 0.12 }
  )

  elements.forEach(el => observer.observe(el))
}

function setupCounters() {
  const counters = document.querySelectorAll<HTMLElement>('.counter')

  const animateCounter = (el: HTMLElement) => {
    const target = parseInt(el.dataset.target || '0', 10)
    const duration = 1800
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(eased * target).toString()
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target as HTMLElement)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 }
  )

  counters.forEach(el => observer.observe(el))
}
