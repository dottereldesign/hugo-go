const SHEET_MODULES = import.meta.glob(
  '../../art/source-images/game/2d-v*/**/*.{png,jpg,jpeg,webp}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

interface SheetAsset {
  sourcePath: string;
  displayPath: string;
  filename: string;
  group: string;
  url: string;
}

export class CharacterSheetsGallery {
  private readonly assets: SheetAsset[];
  private readonly grid: HTMLElement;
  private readonly dialog: HTMLDialogElement;
  private readonly dialogImage: HTMLImageElement;
  private readonly dialogTitle: HTMLElement;
  private readonly dialogPath: HTMLElement;
  private hydrated = false;

  constructor(root: HTMLElement) {
    this.grid = this.required(root, '[data-character-sheets-grid]');
    this.dialog = this.required(root, '#character-sheet-dialog');
    this.dialogImage = this.required(this.dialog, '[data-character-sheet-large]');
    this.dialogTitle = this.required(this.dialog, '[data-character-sheet-title]');
    this.dialogPath = this.required(this.dialog, '[data-character-sheet-path]');
    this.assets = Object.entries(SHEET_MODULES)
      .map(([sourcePath, moduleUrl]) => this.toAsset(sourcePath, moduleUrl))
      .sort((left, right) =>
        left.group.localeCompare(right.group) || left.filename.localeCompare(right.filename),
      );

    this.grid.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-sheet-index]');
      if (!button) return;
      this.open(this.assets[Number(button.dataset.sheetIndex)]);
    });
    this.required<HTMLButtonElement>(this.dialog, '[data-character-sheet-close]')
      .addEventListener('click', () => this.dialog.close());
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
  }

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    let currentGroup = '';
    let groupRoot: HTMLElement | null = null;

    this.assets.forEach((asset, index) => {
      if (asset.group !== currentGroup) {
        currentGroup = asset.group;
        const section = document.createElement('section');
        section.className = 'character-sheet-group';
        section.innerHTML = `
          <header>
            <span>CHARACTER SHEETS</span>
            <h2>${this.escape(asset.group)}</h2>
          </header>
          <div class="character-sheet-grid"></div>
        `;
        this.grid.append(section);
        groupRoot = this.required<HTMLElement>(section, '.character-sheet-grid');
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'character-sheet-card';
      button.dataset.sheetIndex = String(index);
      button.innerHTML = `
        <span class="character-sheet-thumbnail">
          <img src="${asset.url}" alt="" loading="lazy" decoding="async">
        </span>
        <strong>${this.escape(asset.filename)}</strong>
        <small>${this.escape(asset.displayPath)}</small>
      `;
      groupRoot?.append(button);
    });
  }

  private open(asset: SheetAsset): void {
    this.dialogImage.src = asset.url;
    this.dialogImage.alt = asset.filename;
    this.dialogTitle.textContent = asset.filename;
    this.dialogPath.textContent = asset.displayPath;
    this.dialog.showModal();
  }

  private toAsset(sourcePath: string, moduleUrl: unknown): SheetAsset {
    if (typeof moduleUrl !== 'string') throw new TypeError(`Invalid sheet URL: ${sourcePath}`);
    const displayPath = sourcePath
      .replace(/\\/g, '/')
      .replace(/^\.\.\/\.\.\//, '');
    const segments = displayPath.split('/');
    const filename = segments.at(-1) ?? displayPath;
    const group = segments.slice(4, -1).join(' / ') || 'reference sheets';
    return { sourcePath, displayPath, filename, group, url: moduleUrl };
  }

  private escape(value: string): string {
    const span = document.createElement('span');
    span.textContent = value;
    return span.innerHTML;
  }

  private required<T extends Element>(root: ParentNode, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Character Sheets element: ${selector}`);
    return element;
  }
}
