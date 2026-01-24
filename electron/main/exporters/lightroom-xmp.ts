import { Asset } from '../../../src/shared/types';
import fs from 'fs';
import path from 'path';

export class LightroomXMPExporter {
  async export(assets: Asset[], volumeMountPoint: string): Promise<number> {
    let exported = 0;

    for (const asset of assets) {
      if (asset.mediaType !== 'photo') continue;

      const fullPath = path.join(volumeMountPoint, asset.relativePath);
      const xmpPath = fullPath + '.xmp';

      const xmpContent = this.generateXMP(asset);
      
      try {
        await fs.promises.writeFile(xmpPath, xmpContent, 'utf-8');
        exported++;
      } catch (error) {
        console.error(`Error writing XMP for ${asset.fileName}:`, error);
      }
    }

    return exported;
  }

  private generateXMP(asset: Asset): string {
    const colorLabel = this.getColorLabelNumber(asset.colorLabel);
    const pickStatus = asset.flagged ? '1' : (asset.rejected ? '-1' : '0');

    return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 6.0.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
      
      <xmp:Rating>${asset.rating}</xmp:Rating>
      <xmp:Label>${colorLabel}</xmp:Label>
      
      ${asset.notes ? `<dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${this.escapeXml(asset.notes)}</rdf:li>
        </rdf:Alt>
      </dc:description>` : ''}
      
      ${asset.tags.length > 0 ? `<dc:subject>
        <rdf:Bag>
          ${asset.tags.map(tag => `<rdf:li>${this.escapeXml(tag)}</rdf:li>`).join('\n          ')}
        </rdf:Bag>
      </dc:subject>` : ''}
      
      <photoshop:Urgency>${pickStatus}</photoshop:Urgency>
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
  }

  private getColorLabelNumber(colorLabel: string | null): string {
    const labels: { [key: string]: string } = {
      'red': 'Red',
      'yellow': 'Yellow',
      'green': 'Green',
      'blue': 'Blue',
      'purple': 'Purple'
    };
    return colorLabel ? labels[colorLabel] || '' : '';
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
