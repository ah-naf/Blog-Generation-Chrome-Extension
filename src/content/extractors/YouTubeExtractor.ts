import { BaseExtractor } from './BaseExtractor';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export class YouTubeExtractor extends BaseExtractor {
  protected platform = 'youtube';

  detect(): boolean {
    return (
      window.location.hostname === 'www.youtube.com' &&
      window.location.pathname === '/watch' &&
      new URLSearchParams(window.location.search).has('v')
    );
  }

  protected extractTitle(): string {
    // Try ytInitialPlayerResponse first
    const playerResponse = this.getYtInitialPlayerResponse();
    if (playerResponse?.videoDetails?.title) {
      return playerResponse.videoDetails.title;
    }

    // Try meta tags
    const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (metaTitle) return metaTitle;

    // Try DOM selectors
    const title = this.querySelector([
      'h1.ytd-watch-metadata yt-formatted-string',
      'ytd-watch-metadata h1',
      '#title yt-formatted-string',
    ]);

    return title || document.title.replace(' - YouTube', '');
  }

  protected extractAuthor(): string {
    // Try ytInitialPlayerResponse
    const playerResponse = this.getYtInitialPlayerResponse();
    if (playerResponse?.videoDetails?.author) {
      return playerResponse.videoDetails.author;
    }

    // Try DOM selectors
    const author = this.querySelector([
      'ytd-channel-name yt-formatted-string',
      '#owner yt-formatted-string',
      'ytd-video-owner-renderer a.yt-simple-endpoint',
    ]);

    return author || 'Unknown';
  }

  protected extractContent(): string {
    const parts: string[] = [];

    // Add video metadata
    const metadata = this.extractVideoMetadata();
    if (metadata.published) parts.push(`**Published:** ${metadata.published}`);
    if (metadata.duration) parts.push(`**Duration:** ${metadata.duration}`);
    if (metadata.views) parts.push(`**Views:** ${metadata.views}`);
    parts.push('');

    // Add description
    const description = this.extractDescription();
    if (description) {
      parts.push('## Description\n');
      parts.push(description);
      parts.push('');
    }

    return parts.join('\n');
  }

  private extractDescription(): string {
    // Try ytInitialPlayerResponse
    const playerResponse = this.getYtInitialPlayerResponse();
    if (playerResponse?.videoDetails?.shortDescription) {
      return playerResponse.videoDetails.shortDescription;
    }

    // Try meta tags
    const metaDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    if (metaDesc) return metaDesc;

    // Try DOM selectors
    const descElement = document.querySelector(
      'ytd-text-inline-expander#description yt-formatted-string, #description yt-formatted-string'
    );

    return descElement?.textContent?.trim() || '';
  }

  private extractVideoMetadata(): {
    published?: string;
    duration?: string;
    views?: string;
  } {
    const metadata: { published?: string; duration?: string; views?: string } = {};

    const playerResponse = this.getYtInitialPlayerResponse();

    if (playerResponse) {
      // Duration
      if (playerResponse.videoDetails?.lengthSeconds) {
        metadata.duration = this.formatDuration(
          parseInt(playerResponse.videoDetails.lengthSeconds)
        );
      }

      // Views
      if (playerResponse.videoDetails?.viewCount) {
        metadata.views = parseInt(playerResponse.videoDetails.viewCount).toLocaleString();
      }

      // Published date
      if (playerResponse.microformat?.playerMicroformatRenderer?.publishDate) {
        metadata.published = new Date(
          playerResponse.microformat.playerMicroformatRenderer.publishDate
        ).toLocaleDateString();
      }
    }

    // Fallback to meta tags
    if (!metadata.published) {
      const uploadDate = document.querySelector('meta[itemprop="uploadDate"]')?.getAttribute('content');
      if (uploadDate) {
        metadata.published = new Date(uploadDate).toLocaleDateString();
      }
    }

    if (!metadata.duration) {
      const durationMeta = document.querySelector('meta[itemprop="duration"]')?.getAttribute('content');
      if (durationMeta) {
        metadata.duration = this.parseDurationISO8601(durationMeta);
      }
    }

    return metadata;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private parseDurationISO8601(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private getYtInitialPlayerResponse(): any {
    try {
      // Try to access from window (may not work in content script)
      if ((window as any).ytInitialPlayerResponse) {
        return (window as any).ytInitialPlayerResponse;
      }

      // Parse from script tags
      const scripts = document.querySelectorAll('script');
      for (const script of Array.from(scripts)) {
        const content = script.textContent || '';
        const match = content.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match) {
          return JSON.parse(match[1]);
        }
      }
    } catch (error) {
      console.error('Failed to parse ytInitialPlayerResponse:', error);
    }

    return null;
  }

  private async extractTranscript(): Promise<string> {
    try {
      const playerResponse = this.getYtInitialPlayerResponse();

      if (!playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
        return '';
      }

      const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;

      // Get English track or first available
      const track = tracks.find((t: any) => t.languageCode === 'en' || t.languageCode.startsWith('en')) || tracks[0];

      if (!track) return '';

      // Fetch transcript
      const transcriptUrl = track.baseUrl + '&fmt=json3';
      const response = await fetch(transcriptUrl);
      const data = await response.json();

      // Parse json3 format
      const segments: TranscriptSegment[] = data.events
        .filter((event: any) => event.segs)
        .map((event: any) => {
          const text = event.segs.map((seg: any) => seg.utf8).join('');
          return {
            text: text.trim(),
            start: event.tStartMs / 1000,
            duration: event.dDurationMs / 1000,
          };
        })
        .filter((item: TranscriptSegment) => item.text);

      // Format as markdown
      const formatted = segments
        .map((seg) => {
          const timestamp = this.formatTimestamp(seg.start);
          return `[${timestamp}] ${seg.text}`;
        })
        .join('\n');

      return formatted ? `## Transcript\n\n${formatted}` : '';
    } catch (error) {
      console.error('Failed to extract transcript:', error);
      return '';
    }
  }

  private formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  protected async extractImages(): Promise<Record<string, string>> {
    const images: Record<string, string> = {};

    try {
      // Extract video thumbnail
      const playerResponse = this.getYtInitialPlayerResponse();

      if (playerResponse?.videoDetails?.thumbnail?.thumbnails) {
        const thumbnails = playerResponse.videoDetails.thumbnail.thumbnails;
        // Get highest quality thumbnail
        const thumbnail = thumbnails[thumbnails.length - 1];
        if (thumbnail?.url) {
          const base64 = await this.fetchImageAsBase64(thumbnail.url);
          if (base64) {
            images[thumbnail.url] = base64;
          }
        }
      }

      // Fallback to meta tag
      if (Object.keys(images).length === 0) {
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
        if (ogImage) {
          const base64 = await this.fetchImageAsBase64(ogImage);
          if (base64) {
            images[ogImage] = base64;
          }
        }
      }
    } catch (error) {
      console.error('Failed to extract YouTube images:', error);
    }

    return images;
  }

  async extract() {
    const result = await super.extract();

    // Add transcript to content if extraction was successful
    if (result.success && result.content) {
      const transcript = await this.extractTranscript();
      if (transcript) {
        result.content.content += '\n\n' + transcript;
      }
    }

    return result;
  }
}
