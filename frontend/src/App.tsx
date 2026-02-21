import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Bookmark, Heart,
  Sunrise, Sun, Moon, Compass, ChevronRight,
  Video, Plus, Zap, FileText, Pencil, Check, X
} from 'lucide-react';
import { apiService, Recipe } from './services/api';

// --- 类型定义 ---
// Recipe 类型已从 api.ts 导入

// --- 灵感菜谱静态数据（作为后备） ---
const INSPIRATIONS: Recipe[] = [
  {
    id: 'i1',
    type: '早餐',
    title: '元气厚蛋烧 🍳',
    description: '嫩滑多汁，唤醒一整天的活力。',
    emoji: '🍳',
    time: '10 min',
    ingredients: ['3个 鸡蛋 🥚', '30ml 牛奶 🥛', '适量 盐和葱花 🧂'],
    steps: ['鸡蛋打散加入牛奶和葱花。', '平底锅刷油，分三次倒入蛋液。', '每次卷起后再倒入新蛋液。', '切段即可享用。'],
    color: '#FFF7ED',
    imageUrl: 'https://images.unsplash.com/photo-1758779527927-56c21385ffce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHRhbWFnb3lha2klMjBlZ2clMjByb2xsfGVufDF8fHx8MTc3MTQ4MTkwMXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'i4',
    type: '早餐',
    title: '蓝莓奇亚籽燕麦 🥣',
    description: '低脂饱腹，减脂期的清爽选择。',
    emoji: '🥣',
    time: '5 min',
    ingredients: ['50g 燕麦片 🌾', '200ml 无糖酸奶 🥛', '适量 蓝莓和奇亚籽 🫐'],
    steps: ['碗中倒入燕麦片和酸奶。', '搅拌均匀后静置5分钟让燕麦变软。', '铺上新鲜蓝莓和奇亚籽。', '拌匀开吃！'],
    color: '#FFF7ED',
    imageUrl: 'https://images.unsplash.com/photo-1610406765661-57646c40da59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlYmVycnklMjBjaGlhJTIwb2F0bWVhbCUyMGJyZWFrZmFzdHxlbnwxfHx8fDE3NzE0ODE5MDF8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'i2',
    type: '午餐',
    title: '照烧鸡腿饭 🍗',
    description: '浓郁酱汁裹着嫩鸡肉，午间充能必备。',
    emoji: '🍗',
    time: '25 min',
    ingredients: ['2个 鸡腿 🍗', '1碗 米饭 🍚', '照烧汁 🍯', '西兰花 🥦'],
    steps: ['鸡腿去骨，鸡皮朝下煎至出油。', '倒入照烧汁小火焖煮至浓稠。', '西兰花焯水备用。', '切块摆盘，淋上汤汁。'],
    color: '#F5F3FF',
    imageUrl: 'https://images.unsplash.com/photo-1636401870585-a8852371e84a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXJpeWFraSUyMGNoaWNrZW4lMjByaWNlJTIwYm93bHxlbnwxfHx8fDE3NzE0NDg0MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'i5',
    type: '午餐',
    title: '滑蛋虾仁烩饭 🍤',
    description: '鲜美虾仁配上滑嫩鸡蛋，一口入魂。',
    emoji: '🍤',
    time: '15 min',
    ingredients: ['8只 虾仁 🦐', '2个 鸡蛋 🥚', '1碗 剩米饭 🍚', '少许 淀粉水 🥣'],
    steps: ['虾仁炒熟盛出。', '蛋液炒至半熟，倒入米饭翻炒。', '倒入虾仁和少许淀粉水增加粘稠感。', '撒葱花出锅。'],
    color: '#F5F3FF',
    imageUrl: 'https://images.unsplash.com/photo-1665199020996-66cfdf8cba00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaHJpbXAlMjBmcmllZCUyMHJpY2UlMjBhc2lhbnxlbnwxfHx8fDE3NzE0ODE5MDF8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'i6',
    type: '午餐',
    title: '韩式肥牛拌饭 🍲',
    description: '超正宗的灵魂拌饭，解腻又过瘾。',
    emoji: '🍲',
    time: '20 min',
    ingredients: ['150g 肥牛卷 🥩', '适量 豆芽/胡萝卜丝 🥕', '1勺 韩式辣酱 🌶️'],
    steps: ['肥牛卷汆烫熟捞出。', '蔬菜丝炒熟备用。', '米饭垫底铺上菜和肉，加辣酱和煎蛋。', '疯狂搅拌！'],
    color: '#F5F3FF',
    imageUrl: 'https://images.unsplash.com/photo-1600289031464-74d374b64991?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBiaWJpbWJhcCUyMGJlZWYlMjByaWNlfGVufDF8fHx8MTc3MTQ4MTkwMnww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'i3',
    type: '晚餐',
    title: '暖心番茄面 🍅',
    description: '酸甜开胃，深夜最温柔的抚慰。',
    emoji: '🍅',
    time: '15 min',
    ingredients: ['2个 大番茄 🍅', '1把 手擀面 🍜', '1个 鸡蛋 🥚'],
    steps: ['番茄切碎炒出汁水。', '加入足量开水煮沸。', '下入面条煮熟，最后打入蛋花。', '加少许盐调味即可。'],
    color: '#EFF6FF',
    imageUrl: 'https://images.unsplash.com/photo-1745817078506-bfc70df458b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b21hdG8lMjBub29kbGUlMjBzb3VwJTIwYXNpYW58ZW58MXx8fHwxNzcxNDgxOTAyfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'i7',
    type: '晚餐',
    title: '蒜香迷迭香煎羊排 🥩',
    description: '犒劳辛苦一天的自己，充满高级感。',
    emoji: '🥩',
    time: '20 min',
    ingredients: ['2块 羊排 🥩', '适量 黄油/迷迭香 🌿', '3瓣 大蒜 🧄'],
    steps: ['羊排两面撒盐和胡椒。', '下锅煎至变色，加入黄油蒜瓣迷迭香。', '不断向羊排淋油直至5分熟。', '静置3分钟后切开。'],
    color: '#EFF6FF',
    imageUrl: 'https://images.unsplash.com/photo-1766589152317-fd811dd44c65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW1iJTIwY2hvcHMlMjByb3NlbWFyeSUyMGdvdXJtZXR8ZW58MXx8fHwxNzcxNDI3NDQyfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'i8',
    type: '晚餐',
    title: '清爽柠檬煎鱼排 🐟',
    description: '轻盈无负担，睡前不给胃留负担。',
    emoji: '🐟',
    time: '15 min',
    ingredients: ['1片 龙利鱼/巴沙鱼 🐟', '半个 柠檬 🍋', '少许 黑胡椒 🧂'],
    steps: ['鱼排吸干水分，撒胡椒。', '锅中少油，中小火煎至两面微黄。', '挤上新鲜柠檬汁提鲜。', '搭配几颗圣女果。'],
    color: '#EFF6FF',
    imageUrl: 'https://images.unsplash.com/photo-1700760933440-5c6a4b4224a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZW1vbiUyMGZpc2glMjBmaWxsZXQlMjBkaW5uZXJ8ZW58MXx8fHwxNzcxNDgxOTAzfDA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { type: 'spring', damping: 25, stiffness: 200 }
};

export default function App() {
  const [tab, setTab] = useState('explore');
  const [view, setView] = useState<'main' | 'loading' | 'detail'>('main');
  const [videoLink, setVideoLink] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [inspirations, setInspirations] = useState<Recipe[]>(INSPIRATIONS);
  const [toast, setToast] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showSaveGuide, setShowSaveGuide] = useState(false);
  const [loadingInspiration, setLoadingInspiration] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{ title: string; description: string; time: string; type: string; ingredients: string[]; steps: string[]; tips: string }>({ title: '', description: '', time: '', type: '其他', ingredients: [], steps: [], tips: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [detailSource, setDetailSource] = useState<'inspiration' | 'favorites' | 'generate'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);

  // Toast 逻辑
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 加载灵感列表
  useEffect(() => {
    if (tab === 'inspiration') {
      loadInspirations();
    }
  }, [tab]);

  // 加载收藏列表
  useEffect(() => {
    if (tab === 'saved') {
      loadFavorites();
    }
  }, [tab]);

  const loadInspirations = async () => {
    setLoadingInspiration(true);
    try {
      const data = await apiService.getInspirationList();
      const fromApi = Array.isArray(data) ? data : [];
      const cats: ('早餐' | '午餐' | '晚餐')[] = ['早餐', '午餐', '晚餐'];
      const merged: Recipe[] = [];
      for (const cat of cats) {
        const apiItems = fromApi.filter(i => (i.type || '其他') === cat);
        const staticItems = INSPIRATIONS.filter(i => i.type === cat);
        merged.push(...(apiItems.length > 0 ? apiItems : staticItems));
      }
      setInspirations(merged);
    } catch (e: any) {
      console.warn('加载灵感失败，使用静态数据:', e.message);
      setInspirations(INSPIRATIONS);
    } finally {
      setLoadingInspiration(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await apiService.getFavorites();
      setFavorites(data.map((r: Recipe & { _id?: unknown }) => ({
        ...r,
        id: String(r.id ?? r._id ?? ''),
        ingredients: r.ingredients ?? [],
        steps: r.steps ?? [],
      })));
    } catch (e: any) {
      console.warn('加载收藏失败:', e.message);
      showToast('加载收藏失败，请重试');
    }
  };

  // 真实生成过程（调用后端 API）
  const handleGenerate = async () => {
    if (!videoLink.trim()) {
      showToast('⚠️ 别忘了输入视频链接哦');
      return;
    }

    setView('loading');
    setIsGenerating(true);
    try {
      const recipe = await apiService.parseVideo(videoLink.trim());
      
      // 转换后端返回的数据格式为前端需要的格式（后端可能返回 _id）
      const recipeWithId = recipe as Recipe & { _id?: string };
      const formattedRecipe: Recipe = {
        id: recipe.id || String(recipeWithId._id ?? '') || `recipe_${Date.now()}`,
        type: recipe.type || '其他',
        title: recipe.title || '美味菜谱 🍳',
        description: recipe.description || '',
        emoji: recipe.emoji || '🍳',
        time: recipe.time || '15 min',
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tips: recipe.tips || '',
        color: recipe.color || '#F0F9FF',
        imageUrl: recipe.imageUrl || '',
        videoUrl: recipe.videoUrl,
        videoSource: recipe.videoSource
      };

      setSelectedRecipe(formattedRecipe);
      setIsEditMode(false);
      setDetailSource('generate');
      setView('detail');
      try {
        const isFav = await apiService.checkFavorite(formattedRecipe.id);
        setShowSaveGuide(!isFav);
      } catch (e) {
        setShowSaveGuide(true);
      }
      setVideoLink('');
      const isFallback = (recipe as Recipe & { isFallback?: boolean }).isFallback;
      showToast(isFallback ? '⚠️ AI 暂时不可用，当前为示例菜谱，可编辑后使用' : '✨ 菜谱生成成功！');
    } catch (e: any) {
      console.error('生成菜谱失败:', e);
      setView('main');
      showToast(`❌ ${e.message || '生成失败，请重试'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 打开菜谱详情（收藏列表只含部分字段，缺食材/步骤时拉取完整详情）
  const openRecipe = async (recipe: Recipe) => {
    setIsEditMode(false);
    setDetailSource(tab === 'inspiration' ? 'inspiration' : tab === 'saved' ? 'favorites' : 'generate');
    const raw = recipe as Recipe & { _id?: string };
    const id = String(raw.id ?? raw._id ?? '');
    const hasFullDetail = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 &&
      Array.isArray(recipe.steps) && recipe.steps.length > 0;

    // 若灵感菜谱缺图，从 INSPIRATIONS 补充
    let recipeWithImage = recipe;
    if (!recipe.imageUrl || !recipe.imageUrl.trim()) {
      const found = INSPIRATIONS.find(r => r.id === recipe.id);
      if (found?.imageUrl) recipeWithImage = { ...recipe, imageUrl: found.imageUrl };
    }

    if (hasFullDetail) {
      setSelectedRecipe(recipeWithImage);
      setView('detail');
    } else if (id) {
      setSelectedRecipe({ ...recipeWithImage, id, ingredients: recipe.ingredients ?? [], steps: recipe.steps ?? [] });
      setView('detail');
      try {
        const full = await apiService.getRecipeDetail(id);
        const fullRaw = full as Recipe & { _id?: string };
        setSelectedRecipe({
          ...full,
          id: String(fullRaw.id ?? fullRaw._id ?? id),
          ingredients: full.ingredients ?? [],
          steps: full.steps ?? [],
          imageUrl: full.imageUrl || recipeWithImage.imageUrl || '',
        });
      } catch (e) {
        // 详情拉取失败时仍显示已有信息（食材/步骤会显示“暂无”）
      }
    } else {
      setSelectedRecipe({ ...recipeWithImage, ingredients: recipe.ingredients ?? [], steps: recipe.steps ?? [] });
      setView('detail');
    }

    // 如果没有图片，自动生成（异步，不阻塞页面显示）
    const hasImage = recipeWithImage.imageUrl && recipeWithImage.imageUrl.trim().length > 0;
    if (id && !hasImage) {
      // 异步生成图片，不阻塞页面
      apiService.generateRecipeImage(id).then((imageUrl) => {
        setSelectedRecipe((prev) => prev ? { ...prev, imageUrl } : null);
        console.log('✅ 图片生成成功');
      }).catch((e: any) => {
        console.warn('图片生成失败（不影响使用）:', e.message);
      });
    }

    try {
      if (id) {
        const isFav = await apiService.checkFavorite(id);
        setShowSaveGuide(!isFav);
      } else {
        setShowSaveGuide(!favorites.find(f => (f.id ?? (f as { _id?: string })._id) === id));
      }
    } catch (e) {
      setShowSaveGuide(!favorites.find(f => String(f.id ?? (f as { _id?: string })._id) === id));
    }
  };

  // 是否为后端真实菜谱 id（24 位 hex）
  const isBackendRecipeId = (id: string) => /^[a-f0-9]{24}$/i.test(String(id || ''));

  // 收藏逻辑（灵感/静态菜谱先创建再收藏，后端菜谱直接收藏）
  const handleSave = async () => {
    if (!selectedRecipe) return;
    
    try {
      let recipeId = String(selectedRecipe.id || '');
      let recipeToSave = selectedRecipe;

      if (!isBackendRecipeId(recipeId)) {
        const created = await apiService.createRecipeFromInspiration(selectedRecipe);
        recipeId = created.id;
        recipeToSave = { ...selectedRecipe, id: recipeId };
        setSelectedRecipe(recipeToSave);
      }

      const isFav = favorites.find(r => r.id === recipeId);
      if (isFav) {
        showToast('✨ 这道菜已经在收藏夹啦！');
        return;
      }

      const success = await apiService.addFavorite(recipeId);
      if (success) {
        setFavorites(prev => [...prev, recipeToSave]);
        setShowSaveGuide(false);
        showToast('✨ 已收藏到我的碗里！');
      } else {
        showToast('收藏失败，请重试');
      }
    } catch (e: any) {
      console.error('收藏失败:', e);
      showToast(`收藏失败: ${e.message || '请重试'}`);
    }
  };

  // 删除收藏逻辑（调用后端 API）
  const handleDelete = async (id: string) => {
    try {
      const success = await apiService.removeFavorite(id);
      if (success) {
        setFavorites(prev => prev.filter(r => r.id !== id));
        setShowDeleteModal(null);
        showToast('已从收藏夹移除');
      } else {
        showToast('删除失败，请重试');
      }
    } catch (e: any) {
      console.error('删除收藏失败:', e);
      showToast(`删除失败: ${e.message || '请重试'}`);
    }
  };

  const canEditRecipe = selectedRecipe?.id && /^[a-f0-9]{24}$/i.test(String(selectedRecipe.id)) && detailSource !== 'inspiration';
  const startEdit = () => {
    if (!selectedRecipe) return;
    setEditForm({
      title: selectedRecipe.title ?? '',
      description: selectedRecipe.description ?? '',
      time: selectedRecipe.time ?? '',
      type: selectedRecipe.type ?? '其他',
      ingredients: [...(selectedRecipe.ingredients ?? [])],
      steps: [...(selectedRecipe.steps ?? [])],
      tips: selectedRecipe.tips ?? '',
    });
    setIsEditMode(true);
  };
  const cancelEdit = () => setIsEditMode(false);
  const saveEdit = async () => {
    if (!selectedRecipe?.id || !canEditRecipe) {
      showToast('该菜谱为示例，无法保存编辑');
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await apiService.updateRecipe(selectedRecipe.id, {
        title: editForm.title,
        description: editForm.description,
        time: editForm.time,
        type: editForm.type as Recipe['type'],
        ingredients: editForm.ingredients,
        steps: editForm.steps,
        tips: editForm.tips,
      });
      setSelectedRecipe({ ...selectedRecipe, ...updated });
      setIsEditMode(false);
      showToast('已保存修改 ✨');
      setFavorites(prev => prev.map(r => r.id === selectedRecipe.id ? { ...r, ...updated } : r));
    } catch (e: any) {
      showToast(e.message || '保存失败，请重试');
    } finally {
      setSavingEdit(false);
    }
  };

  // 获取基于时间的问候语
  const getTimeInfo = () => {
    const hour = new Date().getHours();
    if (hour < 10) return { label: 'Good Morning!', sub: '该吃早餐啦', icon: <Sunrise className="text-orange-400" /> };
    if (hour < 14) return { label: 'Lunch Time!', sub: '吃顿好的犒劳下', icon: <Sun className="text-yellow-500" /> };
    if (hour < 19) return { label: 'Afternoon Tea?', sub: '来点下午茶吗', icon: <Sun className="text-pink-400" /> };
    return { label: 'Good Night!', sub: '晚餐也要有仪式感', icon: <Moon className="text-blue-500" /> };
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F0F2F5] p-4">
      {/* 手机容器 */}
      <div className="relative w-[375px] h-[812px] bg-white rounded-[50px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border-[8px] border-[#111] overflow-hidden flex flex-col select-none">
        
        {/* 状态栏 */}
        <div className="h-12 w-full flex justify-between items-center px-10 z-[60] shrink-0 text-slate-900">
          <span className="text-[14px] font-bold">9:41</span>
          <div className="flex gap-1.5 items-center">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 11C8.55228 11 9 10.5523 9 10C9 9.44772 8.55228 9 8 9C7.44772 9 7 9.44772 7 10C7 10.5523 7.44772 11 8 11Z" fill="currentColor"/><path d="M10.5 7.5C9.67157 6.67157 8.58075 6.20711 7.5 6.20711C6.41925 6.20711 5.32843 6.67157 4.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 5C11.3431 3.34315 9.17157 2.41421 7 2.41421C4.82843 2.41421 2.65685 3.34315 1 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="0" y="1" width="20" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="2" y="3" width="16" height="6" rx="1" fill="currentColor"/><rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor"/></svg>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-hidden relative">
          {/* 灵动装饰背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF5E8]">
            <div className="absolute top-20 right-10 w-32 h-32 bg-orange-50/40 rounded-full blur-3xl" />
            <div className="absolute top-40 left-8 w-24 h-24 bg-pink-50/30 rounded-full blur-2xl" />
            <div className="absolute bottom-32 right-12 w-40 h-40 bg-yellow-50/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-16 w-28 h-28 bg-orange-50/25 rounded-full blur-2xl" />
            <div className="absolute top-32 left-20 w-2 h-2 bg-orange-200/40 rounded-full" />
            <div className="absolute top-48 right-24 w-1.5 h-1.5 bg-pink-200/40 rounded-full" />
            <div className="absolute bottom-40 left-12 w-2 h-2 bg-yellow-200/40 rounded-full" />
            <div className="absolute bottom-28 right-20 w-1.5 h-1.5 bg-orange-200/30 rounded-full" />
          </div>

          {/* 主页面内容 */}
          {view === 'main' && (
            <div className="h-full overflow-y-auto no-scrollbar relative z-10">
              <AnimatePresence mode="wait">
                {/* 首页：探索 */}
                {tab === 'explore' && (
                  <motion.div
                    key="explore"
                    {...pageTransition}
                    className="h-full flex flex-col justify-between px-8 py-8"
                  >
                    <div className="mb-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[#FF8C42] text-[10px] font-black tracking-widest uppercase mb-4">
                        AI Powered
                      </div>
                      <h1 className="text-[32px] leading-tight font-black text-[#1A1A1A] mb-3">
                        美食视频<br/><span className="text-[#FF8C42]">生成</span>专属菜谱
                      </h1>
                      <p className="text-[13px] text-[#94A3B8] font-medium leading-relaxed">
                        一键解析烹饪视频，自动生成专业步骤<br/>让下厨变得简单又有序 ✨
                      </p>
                    </div>

                    <div className="bg-white rounded-[32px] p-5 shadow-[0_20px_40px_-12px_rgba(255,140,66,0.08)] border border-orange-50 mb-6">
                      <div className="relative mb-3 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10">
                          <Video size={18} />
                        </div>
                        <input
                          value={videoLink}
                          onChange={(e) => setVideoLink(e.target.value)}
                          className="w-full h-[52px] bg-orange-50/40 border-2 border-orange-200 shadow-inner rounded-2xl pl-12 pr-4 text-sm font-semibold outline-none placeholder:text-slate-400 focus:border-[#FF8C42] focus:bg-white focus:ring-4 focus:ring-orange-100/50 transition-all py-3.5"
                          placeholder="粘贴视频链接到这里..."
                        />
                      </div>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full h-[52px] bg-[#FF8C42] text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-orange-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap size={18} fill="currentColor" /> 开始生成菜谱
                      </button>
                      <div className="mt-3.5 flex justify-center items-center gap-2">
                        <div className="flex -space-x-2">
                          {['🥗', '🍳', '🍜'].map((emoji, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] shadow-sm overflow-hidden">
                              {emoji}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">
                          已解析 <span className="text-[#FF8C42]">{favorites.length > 0 ? favorites.length : '2,482'}</span> 个灵感菜谱
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-2">
                      <div className="bg-[#FFF9F2] p-4 rounded-[28px] border border-orange-100/50">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-400 shadow-sm mb-3">
                          <Zap size={20} />
                        </div>
                        <h4 className="font-black text-[#1A1A1A] text-sm mb-1">快速解析</h4>
                        <p className="text-[10px] text-slate-400 font-bold">精准解析视频内容</p>
                      </div>
                      <div className="bg-[#F2F7FF] p-4 rounded-[28px] border border-blue-100/50">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-400 shadow-sm mb-3">
                          <FileText size={20} />
                        </div>
                        <h4 className="font-black text-[#1A1A1A] text-sm mb-1">智能提取</h4>
                        <p className="text-[10px] text-slate-400 font-bold">自动整理食材与步骤</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tab: 灵感 */}
                {tab === 'inspiration' && (
                  <motion.div key="inspiration" {...pageTransition} className="px-8 pt-6 pb-24">
                    <header className="mb-8">
                      <div className="flex items-center gap-2 text-[24px] font-black text-[#1A1A1A] mb-1">
                        {getTimeInfo().icon} {getTimeInfo().label}
                      </div>
                      <p className="text-[14px] text-slate-400 font-bold">{getTimeInfo().sub}</p>
                    </header>
                    {loadingInspiration ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-slate-400 text-sm">加载中...</div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {['早餐', '午餐', '晚餐'].map(cat => {
                          const items = inspirations.filter(i => (i.type || '其他') === cat);
                          if (items.length === 0) return null;
                          return (
                            <div key={cat} className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-1 w-6 rounded-full ${cat === '早餐' ? 'bg-orange-400' : cat === '午餐' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                                <h3 className="text-[15px] font-black text-[#1A1A1A] opacity-80">{cat}系列</h3>
                              </div>
                              <div className="grid grid-cols-1 gap-5">
                                {items.map((item, idx) => (
                                  <div key={item.id || `insp-${cat}-${idx}`} onClick={() => openRecipe(item)} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                                    <div className="h-32 flex items-center justify-center text-5xl" style={{ backgroundColor: item.color || '#F0F9FF' }}>{item.emoji || '🍳'}</div>
                                    <div className="p-5">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${cat === '早餐' ? 'bg-orange-50 text-orange-600' : cat === '午餐' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{item.time || ''}</span>
                                      </div>
                                      <h4 className="font-black text-lg text-[#1A1A1A] mb-1">{item.title || '菜谱'}</h4>
                                      <p className="text-sm text-slate-400 font-medium line-clamp-1">{item.description || ''}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Tab: 收藏 */}
                {tab === 'saved' && (
                  <motion.div key="saved" {...pageTransition} className="px-8 pt-6 pb-24">
                    <header className="mb-8 flex justify-between items-center">
                      <h2 className="text-[24px] font-black text-[#1A1A1A]">我的收藏 💖</h2>
                      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                        <Heart size={20} fill="currentColor" />
                      </div>
                    </header>
                    {favorites.length === 0 ? (
                      <div className="flex flex-col items-center justify-center pt-32 opacity-60 text-center px-10">
                        <div className="w-24 h-24 bg-slate-50 rounded-full mb-6 flex items-center justify-center text-4xl">🥘</div>
                        <p className="text-[15px] text-slate-400 font-bold leading-relaxed">暂时还没有收藏呢，去"灵感"页或者直接解析视频试试看吧！</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {favorites.map(recipe => (
                          <div 
                            key={recipe.id} 
                            onClick={() => openRecipe(recipe)}
                            onContextMenu={(e) => { e.preventDefault(); setShowDeleteModal(recipe.id); }}
                            className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-4"
                          >
                            <div className="text-3xl">{recipe.emoji}</div>
                            <div className="flex-1">
                              <h4 className="text-[16px] font-black text-[#1A1A1A] mb-1 truncate">{recipe.title}</h4>
                              <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[11px] font-bold">{recipe.time}</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                          </div>
                        ))}
                        <p className="text-center text-[11px] text-slate-300 font-bold pt-4">长按卡片可以移除收藏哦</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Loading 状态 */}
          {view === 'loading' && (
            <div className="absolute inset-0 bg-orange-50 z-50 flex flex-col items-center justify-center px-10">
              <div className="w-24 h-24 bg-white rounded-[32px] shadow-lg flex items-center justify-center text-5xl animate-bounce">🍳</div>
              <p className="text-[18px] text-[#1A1A1A] mt-8 font-black">AI 正在努力解析中...</p>
              <p className="text-[13px] text-slate-400 font-medium mt-3">可能需要等待 1-2 分钟 ⏱️</p>
            </div>
          )}

          {/* 详情页浮层 */}
          <AnimatePresence>
            {view === 'detail' && selectedRecipe && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView('main')} className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[90]" />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 bg-white z-[100] overflow-y-auto rounded-t-[40px] mt-20 pb-20 no-scrollbar">
                  <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-6 flex justify-between items-center z-10">
                    <button onClick={() => setView('main')} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600"><ChevronLeft /></button>
                    <div className="flex items-center gap-2">
                      {canEditRecipe && !isEditMode && (
                        <button onClick={startEdit} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600" title="编辑"><Pencil size={18} /></button>
                      )}
                      <div className="relative">
                        <button onClick={handleSave} className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                          <Heart size={20} fill={favorites.find(r => r.id === selectedRecipe.id) ? "#FF8C42" : "none"} className="text-[#FF8C42]" />
                        </button>
                        {showSaveGuide && !favorites.find(r => r.id === selectedRecipe.id) && (
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute top-14 right-0 bg-[#1A1A1A] text-white text-[12px] font-bold px-4 py-2 rounded-xl shadow-xl whitespace-nowrap z-20">
                            收藏到碗里 ✨
                            <div className="absolute -top-1 right-4 w-2 h-2 bg-[#1A1A1A] rotate-45" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-8 mt-2">
                    {selectedRecipe.imageUrl && (
                      <div className="w-full h-56 rounded-[32px] overflow-hidden mb-8 shadow-xl border-4 border-white"><img src={selectedRecipe.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                    )}
                    {isEditMode ? (
                      <>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">标题</label>
                        <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="w-full text-2xl font-black text-[#1A1A1A] mb-4 p-3 rounded-xl border border-slate-200 bg-white" placeholder="菜谱名称" />
                        <div className="flex gap-3 mb-4">
                          <div className="flex-1">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">时长</label>
                            <input value={editForm.time} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold" placeholder="如 15 min" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">类型</label>
                            <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold">
                              {['早餐', '午餐', '晚餐', '其他'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">简介</label>
                        <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 mb-6" placeholder="一句话描述" />
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">食材清单</h5>
                        <div className="space-y-2 mb-4">
                          {editForm.ingredients.map((ing, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input value={ing} onChange={e => setEditForm(f => ({ ...f, ingredients: f.ingredients.map((_, j) => j === i ? e.target.value : _) }))} className="flex-1 p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold" placeholder={`食材 ${i + 1}`} />
                              <button type="button" onClick={() => setEditForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))} className="p-2 text-slate-400 hover:text-red-500"><X size={18} /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => setEditForm(f => ({ ...f, ingredients: [...f.ingredients, ''] }))} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm font-bold">+ 添加一行食材</button>
                        </div>
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">烹饪步骤</h5>
                        <div className="space-y-3 mb-6">
                          {editForm.steps.map((step, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <span className="flex-shrink-0 w-7 h-7 bg-orange-50 text-[#FF8C42] rounded-lg flex items-center justify-center font-black text-xs">{i + 1}</span>
                              <input value={step} onChange={e => setEditForm(f => ({ ...f, steps: f.steps.map((_, j) => j === i ? e.target.value : _) }))} className="flex-1 p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold" placeholder={`步骤 ${i + 1}`} />
                              <button type="button" onClick={() => setEditForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))} className="p-2 text-slate-400 hover:text-red-500 mt-1"><X size={18} /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => setEditForm(f => ({ ...f, steps: [...f.steps, ''] }))} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm font-bold">+ 添加一步</button>
                        </div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">💡 专业建议（选填）</label>
                        <textarea value={editForm.tips} onChange={e => setEditForm(f => ({ ...f, tips: e.target.value }))} rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium mb-8" placeholder="小贴士" />
                        <div className="flex gap-3 pb-8">
                          <button onClick={saveEdit} disabled={savingEdit} className="flex-1 h-12 bg-[#FF8C42] text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"><Check size={18} /> {savingEdit ? '保存中…' : '保存'}</button>
                          <button onClick={cancelEdit} className="h-12 px-6 text-slate-500 font-bold rounded-2xl border border-slate-200">取消</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="text-3xl font-black text-[#1A1A1A] mb-3 leading-tight">{selectedRecipe.title}</h1>
                        <div className="flex items-center gap-3 mb-8">
                          <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[12px] font-bold">{selectedRecipe.time}</span>
                          <p className="text-[14px] text-slate-400 font-medium">{selectedRecipe.description}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[32px] mb-10 border border-slate-100 shadow-inner">
                          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">食材清单</h5>
                          <div className="space-y-3">
                            {(selectedRecipe.ingredients ?? []).map((ing, i) => (
                              <div key={i} className="flex items-center gap-3 text-[#1A1A1A] font-bold text-sm bg-white p-3 rounded-xl border border-slate-200/50 shadow-sm transition-all hover:translate-x-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C42]" /> {ing}
                              </div>
                            ))}
                            {!(selectedRecipe.ingredients?.length) && <p className="text-slate-400 text-sm">暂无食材信息</p>}
                          </div>
                        </div>
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">烹饪步骤</h5>
                        <div className="space-y-8 mb-10">
                          {(selectedRecipe.steps ?? []).map((step, i) => (
                            <div key={i} className="flex gap-4 group">
                              <div className="flex-shrink-0 w-8 h-8 bg-orange-50 text-[#FF8C42] rounded-lg flex items-center justify-center font-black text-sm">{i+1}</div>
                              <p className="text-[#1A1A1A] font-bold leading-relaxed text-[15px] pt-1.5">{step}</p>
                            </div>
                          ))}
                          {!(selectedRecipe.steps?.length) && <p className="text-slate-400 text-sm">暂无步骤信息</p>}
                        </div>
                        {selectedRecipe.tips && (
                          <div className="p-6 bg-orange-50 rounded-[32px] mb-10 border border-orange-100">
                            <h5 className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-3">💡 专业建议</h5>
                            <p className="text-[14px] text-[#1A1A1A] font-bold leading-relaxed">{selectedRecipe.tips}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 底部导航 */}
        <div className="h-[84px] bg-white border-t border-slate-50 flex items-center justify-around px-6 pb-4 shrink-0 z-50">
          {[
            { id: 'explore', icon: Plus, label: '探索' },
            { id: 'inspiration', icon: Compass, label: '灵感' },
            { id: 'saved', icon: Bookmark, label: '收藏' }
          ].map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setView('main'); }} className={`flex flex-col items-center gap-1.5 transition-all outline-none ${tab === item.id ? 'text-[#FF8C42]' : 'text-slate-300 hover:text-slate-400'}`}>
              <div className={`p-2.5 rounded-2xl transition-all ${tab === item.id ? 'bg-orange-50' : ''}`}><item.icon size={22} strokeWidth={tab === item.id ? 2.5 : 2} /></div>
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 悬浮 Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className="fixed top-16 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-[13px] font-bold px-6 py-3 rounded-2xl shadow-2xl z-[200]">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 删除确认 Modal */}
        {showDeleteModal && (
          <div className="absolute inset-0 z-[100] flex items-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(null)} />
            <div className="relative w-full bg-white rounded-t-[40px] p-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <h4 className="text-[20px] font-black text-[#1A1A1A] mb-2 text-center">要删掉它吗？🥺</h4>
              <div className="flex flex-col gap-4 mt-8">
                <button onClick={() => handleDelete(showDeleteModal!)} className="h-14 bg-red-500 text-white font-black rounded-2xl active:scale-95 transition-all">残忍删除</button>
                <button onClick={() => setShowDeleteModal(null)} className="h-14 text-slate-400 font-bold">再考虑一下</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes slide-in-from-bottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-in { animation: slide-in-from-bottom 0.3s ease-out; }
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');
      `}} />
    </div>
  );
}
