import process from 'node:process'
import { initializeLocalSite } from '../admin/local-site'

await initializeLocalSite(process.env.STARDUST_INITIAL_SITE || '/opt/stardust/initial-site')
console.log('本地博客初始版本已就绪。')
