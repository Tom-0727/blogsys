#!/usr/bin/env python3
"""
网站访问分析工具
分析Nginx访问日志并生成可视化报告
"""

import re
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.offline as pyo
from datetime import datetime, timedelta
from collections import Counter
import os
# import geoip2.database  # 可选：用于IP地理位置解析
from urllib.parse import unquote

class WebsiteAnalytics:
    def __init__(self, log_file_path="/var/log/nginx/blogsys_access.log"):
        self.log_file_path = log_file_path
        self.data = []
        self.df = None
        
    def parse_log_line(self, line):
        """解析nginx日志行"""
        # nginx日志格式: IP - - [时间] "请求" 状态码 大小 "引用页" "用户代理"
        pattern = r'(\S+) - - \[(.*?)\] "(\S+) (\S+) (\S+)" (\d+) (\S+) "(.*?)" "(.*?)"'
        match = re.match(pattern, line)
        
        if match:
            ip, timestamp, method, path, protocol, status, size, referer, user_agent = match.groups()
            
            # 解析时间
            try:
                dt = datetime.strptime(timestamp, '%d/%b/%Y:%H:%M:%S %z')
            except:
                try:
                    # 如果带时区解析失败，尝试简单格式
                    dt = datetime.strptime(timestamp.split(' ')[0], '%d/%b/%Y:%H:%M:%S')
                except:
                    dt = datetime.now()
            
            return {
                'ip': ip,
                'datetime': dt,
                'date': dt.date(),
                'hour': dt.hour,
                'method': method,
                'path': unquote(path),  # URL解码
                'status_code': int(status),
                'size': int(size) if size.isdigit() else 0,
                'referer': referer if referer != '-' else None,
                'user_agent': user_agent,
                'browser': self.extract_browser(user_agent),
                'os': self.extract_os(user_agent),
                'is_mobile': self.is_mobile_device(user_agent)
            }
        return None
    
    def extract_browser(self, user_agent):
        """从User-Agent提取浏览器信息"""
        ua = user_agent.lower()
        if 'edge' in ua or 'edg' in ua:
            return 'Edge'
        elif 'chrome' in ua:
            return 'Chrome'
        elif 'firefox' in ua:
            return 'Firefox'
        elif 'safari' in ua and 'chrome' not in ua:
            return 'Safari'
        elif 'opera' in ua:
            return 'Opera'
        else:
            return 'Other'
    
    def extract_os(self, user_agent):
        """从User-Agent提取操作系统信息"""
        ua = user_agent.lower()
        if 'windows' in ua:
            return 'Windows'
        elif 'mac' in ua:
            return 'macOS'
        elif 'linux' in ua:
            return 'Linux'
        elif 'android' in ua:
            return 'Android'
        elif 'ios' in ua or 'iphone' in ua or 'ipad' in ua:
            return 'iOS'
        else:
            return 'Other'
    
    def is_mobile_device(self, user_agent):
        """判断是否为移动设备"""
        mobile_keywords = ['mobile', 'android', 'iphone', 'ipad', 'phone']
        ua = user_agent.lower()
        return any(keyword in ua for keyword in mobile_keywords)
    
    def load_data(self):
        """加载并解析日志数据"""
        if not os.path.exists(self.log_file_path):
            raise FileNotFoundError(f"日志文件不存在: {self.log_file_path}")
        
        print(f"正在读取日志文件: {self.log_file_path}")
        
        with open(self.log_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if line:
                    parsed = self.parse_log_line(line)
                    if parsed:
                        self.data.append(parsed)
        
        if not self.data:
            raise ValueError("没有找到有效的日志数据")
        
        self.df = pd.DataFrame(self.data)
        print(f"成功解析 {len(self.df)} 条访问记录")
        
    def get_basic_stats(self):
        """获取基本统计信息"""
        if self.df is None:
            return {}
        
        stats = {
            'total_visits': len(self.df),
            'unique_visitors': self.df['ip'].nunique(),
            'unique_pages': self.df['path'].nunique(),
            'date_range': {
                'start': self.df['date'].min(),
                'end': self.df['date'].max()
            },
            'avg_daily_visits': len(self.df) / max(1, (self.df['date'].max() - self.df['date'].min()).days + 1)
        }
        return stats
    
    def create_visualizations(self):
        """创建所有可视化图表"""
        if self.df is None:
            self.load_data()
        
        # 创建子图布局
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=[
                '每日访问量', 'Top访客IP',
                '每小时访问分布', '浏览器分布',
                '最受欢迎的页面', '状态码分布'
            ],
            specs=[
                [{"secondary_y": False}, {"type": "bar"}],
                [{"type": "bar"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "pie"}]
            ]
        )
        
        # 1. 每日访问量
        daily_visits = self.df.groupby('date').size().reset_index(name='visits')
        fig.add_trace(
            go.Scatter(
                x=daily_visits['date'], 
                y=daily_visits['visits'],
                mode='lines+markers',
                name='每日访问量',
                line=dict(color='#1f77b4', width=3),
                marker=dict(size=8)
            ),
            row=1, col=1
        )
        
        # 2. Top访客IP
        top_ips = self.df['ip'].value_counts().head(10)
        fig.add_trace(
            go.Bar(
                x=top_ips.values,
                y=top_ips.index,
                orientation='h',
                name='访问次数',
                marker_color='#ff7f0e'
            ),
            row=1, col=2
        )
        
        # 3. 每小时访问分布
        hourly_visits = self.df.groupby('hour').size()
        fig.add_trace(
            go.Bar(
                x=hourly_visits.index,
                y=hourly_visits.values,
                name='小时访问量',
                marker_color='#2ca02c'
            ),
            row=2, col=1
        )
        
        # 4. 浏览器分布
        browser_stats = self.df['browser'].value_counts()
        fig.add_trace(
            go.Pie(
                labels=browser_stats.index,
                values=browser_stats.values,
                name="浏览器"
            ),
            row=2, col=2
        )
        
        # 5. 最受欢迎的页面（排除静态资源）
        page_visits = self.df[
            ~self.df['path'].str.contains(r'\.(css|js|jpg|png|gif|ico|svg|woff|map)$', na=False, regex=True)
        ]['path'].value_counts().head(10)
        
        fig.add_trace(
            go.Bar(
                x=page_visits.values,
                y=[path[:50] + '...' if len(path) > 50 else path for path in page_visits.index],
                orientation='h',
                name='页面访问量',
                marker_color='#d62728'
            ),
            row=3, col=1
        )
        
        # 6. 状态码分布
        status_stats = self.df['status_code'].value_counts()
        colors = ['#2ca02c' if code == 200 else '#ff7f0e' if code < 400 else '#d62728' 
                 for code in status_stats.index]
        fig.add_trace(
            go.Pie(
                labels=[f"{code}" for code in status_stats.index],
                values=status_stats.values,
                name="状态码",
                marker_colors=colors
            ),
            row=3, col=2
        )
        
        # 更新布局
        fig.update_layout(
            height=1200,
            title_text=f"网站访问分析报告 - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            title_x=0.5,
            showlegend=False,
            font=dict(size=12)
        )
        
        return fig
    
    def create_detailed_charts(self):
        """创建详细的单独图表"""
        charts = {}
        
        # 访问趋势图
        daily_visits = self.df.groupby('date').agg({
            'ip': ['count', 'nunique']
        }).round(2)
        daily_visits.columns = ['总访问量', '独立访客']
        daily_visits = daily_visits.reset_index()
        
        trend_fig = go.Figure()
        trend_fig.add_trace(go.Scatter(
            x=daily_visits['date'],
            y=daily_visits['总访问量'],
            mode='lines+markers',
            name='总访问量',
            line=dict(color='#1f77b4', width=3)
        ))
        trend_fig.add_trace(go.Scatter(
            x=daily_visits['date'],
            y=daily_visits['独立访客'],
            mode='lines+markers',
            name='独立访客',
            line=dict(color='#ff7f0e', width=3),
            yaxis='y2'
        ))
        
        trend_fig.update_layout(
            title='访问趋势分析',
            xaxis_title='日期',
            yaxis_title='总访问量',
            yaxis2=dict(title='独立访客', overlaying='y', side='right'),
            hovermode='x unified'
        )
        charts['trend'] = trend_fig
        
        # 地理分布（需要IP地理位置数据库，这里用模拟数据）
        ip_stats = self.df['ip'].value_counts().head(20)
        geo_fig = go.Figure(data=go.Bar(
            x=ip_stats.index,
            y=ip_stats.values,
            marker_color='#17becf'
        ))
        geo_fig.update_layout(
            title='访客IP分布',
            xaxis_title='IP地址',
            yaxis_title='访问次数',
            xaxis_tickangle=-45
        )
        charts['geo'] = geo_fig
        
        return charts
    
    def generate_report(self, output_file="website_analytics_report.html"):
        """生成完整的HTML报告"""
        self.load_data()
        stats = self.get_basic_stats()
        
        # 创建主要图表
        main_fig = self.create_visualizations()
        
        # 创建详细图表
        detailed_charts = self.create_detailed_charts()
        
        # 生成HTML报告
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>网站访问分析报告</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .stats {{ background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }}
                .stats h3 {{ margin-top: 0; color: #333; }}
                .stat-item {{ display: inline-block; margin: 10px 20px; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #1f77b4; }}
                .stat-label {{ font-size: 14px; color: #666; }}
                .chart-section {{ margin: 30px 0; }}
            </style>
        </head>
        <body>
            <h1>🌐 网站访问分析报告</h1>
            <p>报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            
            <div class="stats">
                <h3>📊 基本统计</h3>
                <div class="stat-item">
                    <div class="stat-value">{stats['total_visits']}</div>
                    <div class="stat-label">总访问量</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{stats['unique_visitors']}</div>
                    <div class="stat-label">独立访客</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{stats['unique_pages']}</div>
                    <div class="stat-label">页面总数</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{stats['avg_daily_visits']:.1f}</div>
                    <div class="stat-label">日均访问</div>
                </div>
            </div>
            
            <div class="chart-section">
                {main_fig.to_html(include_plotlyjs=True, div_id="main-charts")}
            </div>
            
            <div class="chart-section">
                <h3>📈 访问趋势详细分析</h3>
                {detailed_charts['trend'].to_html(include_plotlyjs=False, div_id="trend-chart")}
            </div>
            
            <div class="chart-section">
                <h3>🌍 访客分布详细分析</h3>
                {detailed_charts['geo'].to_html(include_plotlyjs=False, div_id="geo-chart")}
            </div>
            
        </body>
        </html>
        """
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"✅ 报告已生成: {output_file}")
        return output_file

def main():
    """主程序"""
    analytics = WebsiteAnalytics()
    
    try:
        print("🚀 开始分析网站访问数据...")
        report_file = analytics.generate_report()
        
        print(f"""
        ✨ 分析完成！
        
        📋 基本统计:
        ▫️ 总访问量: {analytics.get_basic_stats()['total_visits']}
        ▫️ 独立访客: {analytics.get_basic_stats()['unique_visitors']}
        ▫️ 页面总数: {analytics.get_basic_stats()['unique_pages']}
        
        📊 报告文件: {report_file}
        
        💡 您可以通过以下方式查看报告:
        1. 直接在浏览器中打开 {report_file}
        2. 或运行: python3 -m http.server 8000
           然后访问: http://localhost:8000/{report_file}
        """)
        
    except Exception as e:
        print(f"❌ 分析过程中出现错误: {e}")

if __name__ == "__main__":
    main() 