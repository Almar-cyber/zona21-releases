import { Asset } from '../../../src/shared/types';
import fs from 'fs';

export class PremiereXMLExporter {
  async export(assets: Asset[], outputPath: string): Promise<void> {
    const xml = this.generateFCPXML(assets);
    await fs.promises.writeFile(outputPath, xml, 'utf-8');
  }

  private generateFCPXML(assets: Asset[]): string {
    const videoAssets = assets.filter(a => a.mediaType === 'video');
    
    let clipItems = '';
    let timelineStart = 0;

    videoAssets.forEach((asset, index) => {
      const duration = asset.duration || 0;
      const frameRate = asset.frameRate || 30;
      const durationFrames = Math.floor(duration * frameRate);

      clipItems += `
      <clipitem id="clipitem-${index + 1}">
        <name>${this.escapeXml(asset.fileName)}</name>
        <duration>${durationFrames}</duration>
        <rate>
          <timebase>${Math.floor(frameRate)}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <start>${timelineStart}</start>
        <end>${timelineStart + durationFrames}</end>
        <in>0</in>
        <out>${durationFrames}</out>
        <file id="file-${index + 1}">
          <name>${this.escapeXml(asset.fileName)}</name>
          <pathurl>file://localhost${this.escapeXml(asset.relativePath)}</pathurl>
          <rate>
            <timebase>${Math.floor(frameRate)}</timebase>
          </rate>
          <duration>${durationFrames}</duration>
          <media>
            <video>
              <duration>${durationFrames}</duration>
              <samplecharacteristics>
                <width>${asset.width}</width>
                <height>${asset.height}</height>
              </samplecharacteristics>
            </video>
          </media>
        </file>
        <labels>
          <label2>${this.getRatingColor(asset.rating)}</label2>
        </labels>
        ${asset.notes ? `<comments>${this.escapeXml(asset.notes)}</comments>` : ''}
      </clipitem>`;

      timelineStart += durationFrames;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <sequence id="sequence-1">
    <name>Zona21 Export</name>
    <duration>${timelineStart}</duration>
    <rate>
      <timebase>30</timebase>
      <ntsc>FALSE</ntsc>
    </rate>
    <media>
      <video>
        <track>
          ${clipItems}
        </track>
      </video>
    </media>
  </sequence>
</xmeml>`;
  }

  private getRatingColor(rating: number): string {
    const colors = ['', 'Lavender', 'Cerulean', 'Forest', 'Yellow', 'Mango'];
    return colors[rating] || '';
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
