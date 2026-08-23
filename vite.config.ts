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
            },
        },
    },
})
