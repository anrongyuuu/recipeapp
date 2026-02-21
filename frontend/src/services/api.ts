// API 服务层 - 连接后端
// Vite 使用 import.meta.env 而不是 process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

interface Recipe {
  id: string;
  type: string;
  title: string;
  description: string;
  emoji: string;
  time: string;
  ingredients: string[];
  steps: string[];
  tips?: string;
  color: string;
  imageUrl?: string;
  videoUrl?: string;
  videoSource?: string;
}

class ApiService {
  private baseUrl: string;
  private wechatCode: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    // 开发环境使用测试 code，生产环境需要从微信获取
    this.wechatCode = import.meta.env.DEV ? 'test-code' : '';
  }

  /**
   * 设置微信 code（小程序环境）
   */
  setWechatCode(code: string) {
    this.wechatCode = code;
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-wechat-code': this.wechatCode,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || '请求失败');
      }

      return data;
    } catch (error: any) {
      console.error('API 请求失败:', error);
      throw error;
    }
  }

  /**
   * 解析视频并生成菜谱
   */
  async parseVideo(url: string): Promise<Recipe> {
    const response = await this.request<Recipe>('/api/video/parse', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || '解析失败');
    }

    return response.data;
  }

  /**
   * 获取每日灵感
   */
  async getDailyInspiration(type?: '早餐' | '午餐' | '晚餐'): Promise<Recipe[]> {
    const url = type
      ? `/api/inspiration/daily?type=${type}`
      : '/api/inspiration/daily';

    const response = await this.request<Recipe[]>(url, {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  }

  /**
   * 获取灵感列表（今日灵感 + 公开菜谱）
   */
  async getInspirationList(): Promise<Recipe[]> {
    const response = await this.request<Recipe[]>('/api/inspiration/list', {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  }

  /**
   * 获取菜谱详情
   */
  async getRecipeDetail(id: string): Promise<Recipe> {
    const response = await this.request<Recipe>(`/api/recipe/${id}`, {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || '获取菜谱失败');
    }

    return response.data;
  }

  /**
   * 搜索菜谱
   */
  async searchRecipes(keyword: string): Promise<Recipe[]> {
    const response = await this.request<{ list: Recipe[] }>(
      `/api/recipe/search?keyword=${encodeURIComponent(keyword)}`,
      {
        method: 'GET',
      }
    );

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.list || [];
  }

  /**
   * 获取我的收藏
   */
  async getFavorites(): Promise<Recipe[]> {
    const response = await this.request<Recipe[]>('/api/favorite', {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  }

  /**
   * 添加收藏
   */
  async addFavorite(recipeId: string): Promise<boolean> {
    const response = await this.request('/api/favorite', {
      method: 'POST',
      body: JSON.stringify({ recipeId }),
    });

    return response.success === true;
  }

  /**
   * 删除收藏
   */
  async removeFavorite(recipeId: string): Promise<boolean> {
    const response = await this.request(`/api/favorite/${recipeId}`, {
      method: 'DELETE',
    });

    return response.success === true;
  }

  /**
   * 检查收藏状态
   */
  async checkFavorite(recipeId: string): Promise<boolean> {
    const response = await this.request<{ isFavorite: boolean }>(
      `/api/favorite/check/${recipeId}`,
      {
        method: 'GET',
      }
    );

    return response.data?.isFavorite || false;
  }

  /**
   * 为菜谱生成图片（AI 生图）
   */
  async generateRecipeImage(recipeId: string): Promise<string> {
    const response = await this.request<{ imageUrl: string }>(
      `/api/recipe/${recipeId}/generate-image`,
      {
        method: 'POST',
      }
    );

    if (!response.success || !response.data?.imageUrl) {
      throw new Error(response.error || '图片生成失败');
    }

    return response.data.imageUrl;
  }
}

export const apiService = new ApiService();
export type { Recipe, ApiResponse };
