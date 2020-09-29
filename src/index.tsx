import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  Cell, CodeCell, MarkdownCell
} from '@jupyterlab/cells';

import {
  INotebookTracker
} from '@jupyterlab/notebook';

/**
 * Extension constants
 */
const AUTORUN_ENABLED_CLASS = 'epi2melabs-autorun-enabled';

const EXT_NAME = 'epi2melabs-autorun';

const AUTORUN = 'autorun';

const MARKDOWN = 'markdown';

const CODE = 'code';


/**
 * Helper method
 */
const toggleAutorun = (tracker: INotebookTracker) => {
    const cell: Cell = tracker.activeCell;
    const metadata = cell.model.metadata;
    if (!!metadata.get(AUTORUN)) {
        cell.model.metadata.set(AUTORUN, false);
        cell.removeClass(AUTORUN_ENABLED_CLASS);
        return
    }
    cell.model.metadata.set(AUTORUN, true);
    cell.addClass(AUTORUN_ENABLED_CLASS);
};


/**
 * Initialization data for the extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: EXT_NAME,
  requires: [INotebookTracker],
  autoStart: true,
  activate: (
      app: JupyterFrontEnd,
      nbTrack: INotebookTracker,
  ) => {
    const command1: string = `${EXT_NAME}:toggle_autorun`;
    app.commands.addCommand(command1, {
      label: 'Toggle autorun cell at launch',
      execute: () => {
        toggleAutorun(nbTrack)
      }
    });

    app.contextMenu.addItem({
      command: `${EXT_NAME}:toggle_autorun`,
      selector: '.jp-Cell',
      rank: 0
    });

    nbTrack.currentChanged.connect(() => {

        const nbIDs:string[] = [];
        const notebookPanel = nbTrack.currentWidget;
        const notebook = nbTrack.currentWidget.content;

        notebook.model.stateChanged.connect(async () => {

        if (notebook.widgets.length > 1){
            const currentId = notebookPanel.id;
            if (nbIDs.includes(currentId)) {
              return
            }

            nbIDs.push(notebookPanel.id);

            notebookPanel.context.ready.then(() => {
                return notebookPanel.sessionContext.ready;
            }).then(async () => {
                notebook.widgets.map((cell: Cell) => {
                  const metadata = cell.model.metadata;

                  if (!!metadata.get(AUTORUN)) {
                    cell.addClass(AUTORUN_ENABLED_CLASS);
                    switch (cell.model.type) {
                      case CODE:
                        CodeCell.execute(cell as CodeCell, notebookPanel.sessionContext, {
                            recordTiming: notebook.notebookConfig.recordTiming
                        });
                        break;
                      case MARKDOWN:
                        (cell as MarkdownCell).rendered = true;
                        break;
                      default:
                        break;
                    }
                  }
                });
            })
        }
      });
    });
}};


export default extension;



