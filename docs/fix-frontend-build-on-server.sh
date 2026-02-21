#!/bin/bash
# 在阿里云服务器上运行，修复前端 npm run build 的 10 个 TS 报错（不依赖 git pull）
# 用法：在项目根目录执行:  bash docs/fix-frontend-build-on-server.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend/src"

echo ">>> 1. 创建 vite-env.d.ts"
printf '%s\n' '/// <reference types="vite/client" />' > vite-env.d.ts

echo ">>> 2. App.simple.tsx - 移除未使用的 React 导入"
sed -i.bak "/^import React from 'react';$/d" App.simple.tsx
rm -f App.simple.tsx.bak

echo ">>> 3. App.test.tsx - 移除未使用的 React 导入"
sed -i.bak "/^import React from 'react';$/d" App.test.tsx
rm -f App.test.tsx.bak

echo ">>> 4. App.tsx - 多处修复"
sed -i.bak \
  -e "s/import React, { useState, useEffect }/import { useState, useEffect }/" \
  -e "s/  Sparkles, Sunrise, Sun,/  Sunrise, Sun,/" \
  -e "s/ Moon, Compass, Clock, ChevronRight,/ Moon, Compass, ChevronRight,/" \
  -e "s/ FileText, Search, Pencil,/ FileText, Pencil,/" \
  -e "s/recipe\._id/(recipe as any)._id/g" \
  -e "s/disabled={view === 'loading'}/disabled={isGenerating}/" \
  App.tsx

# 在组件 state 声明处插入 isGenerating（在 detailSource 那行后面）
sed -i.bak "/const \[detailSource, setDetailSource\] = useState.*'generate'\);$/a\\
  const [isGenerating, setIsGenerating] = useState(false);" App.tsx

# 在 setView('loading'); 下一行插入 setIsGenerating(true)
sed -i.bak "/setView('loading');$/a\\
    setIsGenerating(true);" App.tsx

# 仅在 handleGenerate 的 catch 前插入 finally（匹配「生成菜谱失败」）
sed -i.bak $'s/    } catch (e: any) {\\\n      console.error(\'生成菜谱失败\',/    } finally { setIsGenerating(false); }\\\n    } catch (e: any) {\\\n      console.error(\'生成菜谱失败\',/' App.tsx

rm -f App.tsx.bak

echo ">>> 5. 完成。请执行: cd $ROOT/frontend && npm run build"
