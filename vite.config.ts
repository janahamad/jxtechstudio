import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                contact: resolve(__dirname, 'contact.html'),
                about: resolve(__dirname, 'about.html'),
                webDevelopment: resolve(__dirname, 'web-development.html'),
                saasProducts: resolve(__dirname, 'saas-products.html'),
                brandUiDesign: resolve(__dirname, 'brand-ui-design.html'),
                blog: resolve(__dirname, 'blog.html'),
                blogReactVsNextjs: resolve(__dirname, 'blog/react-vs-nextjs.html'),
                blogProductionReady: resolve(__dirname, 'blog/production-ready-web-app.html'),
                blogScopingMvp: resolve(__dirname, 'blog/scoping-an-mvp.html'),
                blogScalingInfra: resolve(__dirname, 'blog/scaling-infrastructure.html'),
                blogAgencyQuestions: resolve(__dirname, 'blog/questions-for-a-web-agency.html'),
                blogRedFlags: resolve(__dirname, 'blog/red-flags-in-a-proposal.html'),
                notFound: resolve(__dirname, '404.html'),

                arMain: resolve(__dirname, 'ar/index.html'),
                arPrivacy: resolve(__dirname, 'ar/privacy.html'),
                arContact: resolve(__dirname, 'ar/contact.html'),
                arAbout: resolve(__dirname, 'ar/about.html'),
                arWebDevelopment: resolve(__dirname, 'ar/web-development.html'),
                arSaasProducts: resolve(__dirname, 'ar/saas-products.html'),
                arBrandUiDesign: resolve(__dirname, 'ar/brand-ui-design.html'),
                arBlog: resolve(__dirname, 'ar/blog.html'),
                arBlogReactVsNextjs: resolve(__dirname, 'ar/blog/react-vs-nextjs.html'),
                arBlogProductionReady: resolve(__dirname, 'ar/blog/production-ready-web-app.html'),
                arBlogScopingMvp: resolve(__dirname, 'ar/blog/scoping-an-mvp.html'),
                arBlogScalingInfra: resolve(__dirname, 'ar/blog/scaling-infrastructure.html'),
                arBlogAgencyQuestions: resolve(__dirname, 'ar/blog/questions-for-a-web-agency.html'),
                arBlogRedFlags: resolve(__dirname, 'ar/blog/red-flags-in-a-proposal.html'),
                arNotFound: resolve(__dirname, 'ar/404.html'),
            },
        },
    },
})
