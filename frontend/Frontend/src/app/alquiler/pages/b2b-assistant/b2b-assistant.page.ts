import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { B2bChatComponent } from '../../components/b2b-chat/b2b-chat.component';

@Component({
  selector: 'app-b2b-assistant',
  standalone: true,
  imports: [CommonModule, B2bChatComponent],
  template: `
    <div class="b2b-page">
      <div class="page-header">
        <h1>🤖 Asistente B2B Inteligente</h1>
        <p class="subtitle">
          Gestiona partners, webhooks y operaciones del estacionamiento con IA
        </p>
      </div>
      
      <div class="chat-wrapper">
        <app-b2b-chat></app-b2b-chat>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🔗</div>
          <h3>Webhooks B2B</h3>
          <p>Integra partners externos con eventos en tiempo real y firmas HMAC seguras</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🧠</div>
          <h3>IA Multimodal</h3>
          <p>Analiza imágenes de placas, tickets y documentos PDF automáticamente</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🛠️</div>
          <h3>Herramientas MCP</h3>
          <p>10+ herramientas especializadas para gestión del estacionamiento</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Analytics</h3>
          <p>Consulta recaudación, ocupación y estadísticas en lenguaje natural</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .b2b-page {
      padding: 30px;
      min-height: 100vh;
      background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
    }

    .page-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .page-header h1 {
      color: #fff;
      font-size: 2.2rem;
      margin: 0 0 10px 0;
      background: linear-gradient(90deg, #00d9ff, #00ff88);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: #888;
      font-size: 1rem;
      margin: 0;
    }

    .chat-wrapper {
      max-width: 800px;
      margin: 0 auto 40px;
      height: 600px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      background: rgba(0, 217, 255, 0.05);
      border-color: rgba(0, 217, 255, 0.3);
      transform: translateY(-5px);
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .feature-card h3 {
      color: #00d9ff;
      font-size: 1.1rem;
      margin: 0 0 8px 0;
    }

    .feature-card p {
      color: #888;
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .b2b-page {
        padding: 15px;
      }

      .page-header h1 {
        font-size: 1.6rem;
      }

      .chat-wrapper {
        height: 500px;
      }
    }
  `]
})
export class B2bAssistantPage {}
