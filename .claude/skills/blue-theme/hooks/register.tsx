import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { COSMOS, OCEAN } from './scenes'

type Look = 'cosmos' | 'ocean'
type Choice = Look | 'off'

/* 專案 → 主題（repo 名稱，小寫）。新增 repo 在這裡加一行，五個 repo 的副本一起更新 */
const BINDINGS: Record<string, Look> = {
  blue_astral_nexus_app: 'cosmos',
  blue_astral_nexus_engine: 'cosmos',
  'aethnous-web': 'cosmos',
  'aethnous-landing': 'cosmos',
  'blue-booking': 'ocean',
  stardust: 'ocean',
}
const NAMES: Record<Choice, string> = { cosmos: '深色宇宙', ocean: '淺色海潮', off: '關閉' }

const cosmosColors = makeColors({
  label: 'Cosmos Nebula',
  only: 'dark',
  roles: { accent: '#5ec4f0', danger: '#e4605a', success: '#5fcf8f', warning: '#e8a35c', pro: '#a68cf0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#070b18',
        'surface-1': '#0c1326',
        'surface-2': '#111a31',
        'surface-3': '#151f39',
        'text-primary': '#eaf0ff',
        'text-secondary': '#b8c4dd',
        'text-muted': '#93a0bd',
      },
    },
  },
})

const oceanColors = makeColors({
  label: 'Ocean Tide',
  only: 'light',
  roles: { accent: '#1c6fb4', danger: '#c0392f', success: '#2e8a57', warning: '#b0782a', pro: '#6a55c4' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e4eff8',
        'surface-1': '#eef5fb',
        'surface-2': '#f7fbfe',
        'text-primary': '#0f2638',
        'text-secondary': '#33536b',
        'text-muted': '#4d6a7f',
      },
    },
  },
})

const BASE: Record<Look, ThemeSetArgs> = {
  cosmos: {
    colors: cosmosColors.theme,
    overrideColorScheme: 'dark',
    backdrop: { scene: 'cosmos', glass: { blur: 18, tint: '#070b18', opacity: 0.62 } },
  },
  ocean: {
    colors: oceanColors.theme,
    overrideColorScheme: 'light',
    backdrop: { scene: 'ocean', glass: { blur: 16, tint: '#f2f8fd', opacity: 0.7 } },
  },
}
const STYLED: Record<Look, ThemeSetArgs> = {
  cosmos: {
    ...BASE.cosmos,
    style: { UserMessage: { backgroundColor: '#14204a', borderColor: '#2a4a80', borderWidth: 1, radius: 16, paddingX: 14, paddingY: 10 } },
  },
  ocean: {
    ...BASE.ocean,
    style: { UserMessage: { backgroundColor: '#dcecf9', borderColor: '#9cc4e4', borderWidth: 1, radius: 16, paddingX: 14, paddingY: 10 } },
  },
}

/* 找出這個 session 所在的 repo：往上找 .git/config 讀 origin 的名稱，找不到就用資料夾名 */
async function projectOf($: EngineInterface, cwd: string) {
  let dir = cwd.replace(/\/+$/, '')
  while (dir) {
    try {
      const config = String(await $.fs.read(`${dir}/.git/config`))
      const url = /\[remote "origin"\][^[]*?url\s*=\s*(\S+)/.exec(config)?.[1]
      const name = url?.replace(/\.git$/, '').split(/[/:]/).pop()
      return { root: dir, name: (name || dir.split('/').pop() || '').toLowerCase() }
    } catch {
      /* 這一層沒有 .git，往上一層 */
    }
    const up = dir.slice(0, dir.lastIndexOf('/'))
    if (up === dir) break
    dir = up
  }
  return { root: cwd, name: (cwd.split('/').pop() || '').toLowerCase() }
}

async function choose($: EngineInterface) {
  const cwd = await $.session.cwd()
  const project = await projectOf($, cwd)
  const override = (await $.store.get(`override:${project.root}`)) as Choice | undefined
  const choice: Choice | undefined = override ?? BINDINGS[project.name]
  return { project, override, choice }
}

async function apply($: EngineInterface, choice: Choice | undefined) {
  if (choice === undefined) return { isDrawn: false, reason: '這個專案沒有綁定主題' }
  if (choice === 'off') {
    await $.theme.clear()
    return { isDrawn: false, reason: '已關閉' }
  }
  const problems = (choice === 'cosmos' ? cosmosColors : oceanColors).problems
  const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
  if (unpainted !== undefined) $.ui.toast(unpainted)
  try {
    return await $.theme.set(STYLED[choice])
  } catch (error) {
    $.ui.log(String(error))
    return await $.theme.set(BASE[choice])
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'custom-theme',
      description: '這個專案的外觀：cosmos 深色宇宙／ocean 淺色海潮／auto 依綁定／off 關閉',
    })
    const { choice } = await choose($)
    const set = await apply($, choice)
    if (!set.isDrawn && choice !== undefined && choice !== 'off') $.ui.status(`主題未顯示：${set.reason}`)
    return next(e)
  })

  on('command.run', { command: 'custom-theme' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const { project } = await choose($)
    const key = `override:${project.root}`
    if (arg === 'cosmos' || arg === 'ocean' || arg === 'off') {
      await $.store.set(key, arg)
    } else if (arg === 'auto') {
      await $.store.delete(key)
    } else if (arg !== '') {
      return { text: '用法：/custom-theme cosmos｜ocean｜auto｜off' }
    }
    const now = await choose($)
    const set = await apply($, now.choice)
    const which = now.choice ? NAMES[now.choice] : '未綁定'
    const how = now.override ? '（這個專案手動指定）' : '（依專案綁定）'
    const drawn = set.isDrawn ? '已套用' : `沒有畫出來：${set.reason}`
    return { text: `${project.name}：${which}${how}，${drawn}` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const scene = e.props.scene
    if (scene !== 'cosmos' && scene !== 'ocean') return next(e)
    const { Svg } = $.ui.resolve(e)
    return scene === 'cosmos'
      ? <Svg source={COSMOS} alt="慢慢漂移的星雲與閃爍的星點" />
      : <Svg source={OCEAN} alt="藍天白雲與慢速起伏的海浪" />
  })
}
