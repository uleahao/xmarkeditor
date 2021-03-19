/* eslint-disable eqeqeq */
import $ from 'jquery'
import "animate.css";
import { message } from 'antd'

function animateCSS(node, animationName, callback) {
    var animations = animationName.split(' ');
    node.classList.add('animated', ...animations)

    function handleAnimationEnd() {
        node.classList.remove('animated', ...animations)
        
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}

function DiagramEditor(config, ui, done)
{
	this.config = (config != null) ? config : this.config;
	this.done = (done != null) ? done : this.done;
	this.ui = (ui != null) ? ui : this.ui;
	var self = this;

	this.handleMessageEvent = function(evt)
	{
		if (self.frame != null && evt.source == self.frame.contentWindow &&
			evt.data.length > 0)
		{
			try
			{
				var msg = JSON.parse(evt.data);

				if (msg != null)
				{
					self.handleMessage(msg);
				}
			}
			catch (e)
			{
				console.error(e);
			}
		}
	};
};

/**
 * Static method to edit the diagram in the given img or object.
 */
DiagramEditor.editElement = function(elt, props)
{
    props = props || {};
    var editor = new DiagramEditor(props.config, props.ui, props.done);

    if (props.drawDomain) {
        editor.drawDomain = props.drawDomain;
    }
    if (props.className) {
        editor.className = props.className;
    }

	return editor.editElement(elt);
};

/**
 * Global configuration.
 */
DiagramEditor.prototype.config = null;

/**
 * Protocol and domain to use.
 */
DiagramEditor.prototype.drawDomain = 'https://www.draw.io/';

/**
 * UI theme to be use.
 */
DiagramEditor.prototype.ui = 'min';

/**
 * Format to use.
 */
DiagramEditor.prototype.format = 'xml';

/**
 * Specifies if libraries should be enabled.
 */
DiagramEditor.prototype.libraries = true;

/**
 * CSS style for the iframe.
 */
DiagramEditor.prototype.frameStyle = 'position:absolute;border:0;width:100%;height:100%;';

/**
 * Adds the iframe and starts editing.
 */
DiagramEditor.prototype.editElement = function(elem)
{
	var src = this.getElementData(elem);
	this.startElement = elem;
	var fmt = this.format;

	if (src.substring(0, 15) === 'data:image/png;')
	{
		fmt = 'xmlpng';
	}
	else if (src.substring(0, 19) === 'data:image/svg+xml;' ||
		elem.nodeName.toLowerCase() == 'svg')
	{
		fmt = 'xmlsvg';
	}

	this.startEditing(src, fmt);

	return this;
};

/**
 * Adds the iframe and starts editing.
 */
DiagramEditor.prototype.getElementData = function(elem)
{
	var name = elem.nodeName.toLowerCase();

	return elem.getAttribute((name == 'svg') ? 'content' :
		((name == 'img') ? 'src' : 'data'));
};

/**
 * Adds the iframe and starts editing.
 */
DiagramEditor.prototype.setElementData = function(elem, data)
{
	var name = elem.nodeName.toLowerCase();

	if (name == 'svg')
	{
		elem.outerHTML = atob(data.substring(data.indexOf(',') + 1));
	}
	else
	{
		elem.setAttribute((name == 'img') ? 'src' : 'data', data);
	}

	return elem;
};

/**
 * Starts the editor for the given data.
 */
DiagramEditor.prototype.startEditing = function(data, format, title)
{
	if (this.frame == null)
	{
		window.addEventListener('message', this.handleMessageEvent);
		this.format = (format != null) ? format : this.format;
		this.title = (title != null) ? title : this.title;
		this.data = data;

        var url = this.getFrameUrl();
		this.frame = this.createFrame(
			url,
			this.getFrameStyle());
        document.body.appendChild(this.frame);
        animateCSS(this.frame, 'zoomInUp faster')
        
        var $toolbar = $(`<div class="drawio-tools">`);
        var $reload = $(`
            <span class="tool">
                <i class="iconfont icon-reload"></i>
            </span>
        `);
        $reload.on('click', () => {
            window.open(url, this.frameName, '')
        })
        $toolbar.append($reload);
        var $close = $(`
            <span class="tool">
                <i class="iconfont icon-remove"></i>
            </span>
        `);
        $close.on('click', () => {
            this.stopEditing();
        })
        $toolbar.append($close);

        this.$toolbar = $toolbar;
        
        $(document.body).append(this.$toolbar);

        animateCSS($toolbar[0], 'fadeIn')

		this.setWaiting(true);
	}
};

/**
 * Updates the waiting cursor.
 */
DiagramEditor.prototype.setWaiting = function(waiting)
{
	if (this.startElement != null)
	{
		// Redirect cursor to parent for SVG and object
		var elt = this.startElement;
		var name = elt.nodeName.toLowerCase();
		
		if (name == 'svg' || name == 'object')
		{
			elt = elt.parentNode;
		}
		
		if (elt != null)
		{
			if (waiting)
			{
				this.frame.style.pointerEvents = 'none';
				this.previousCursor = elt.style.cursor;
                elt.style.cursor = 'wait';

                //30秒内如果未装载成功，则自动退出
                this.timeoutId = setTimeout(() => {
					this.setWaiting(false);
					this.stopEditing();
					message.error('编辑器装载失败，请稍候再试！')
                }, 30000);
			}
			else
			{
				elt.style.cursor = this.previousCursor;
                this.frame.style.pointerEvents = '';
                clearTimeout(this.timeoutId);
                if (this.$toolbar) {
                    animateCSS(this.$toolbar[0], 'fadeOut', () => {
                        this.$toolbar.remove();
                    })
                }
			}
		}
	}
};

/**
 * Updates the waiting cursor.
 */
DiagramEditor.prototype.setActive = function(active)
{
	if (active)
	{
		this.previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	else
	{
		document.body.style.overflow = this.previousOverflow;
	}
};

/**
 * Removes the iframe.
 */
DiagramEditor.prototype.stopEditing = function()
{
	if (this.frame != null)
	{
        window.removeEventListener('message', this.handleMessageEvent);
        animateCSS(this.frame, 'zoomOut', () => {
            document.body.removeChild(this.frame);
            this.setActive(false);
            this.frame = null;
        })
		
        if (this.$toolbar) {
            this.$toolbar.remove();
        }
	}
};

/**
 * Send the given message to the iframe.
 */
DiagramEditor.prototype.postMessage = function(msg)
{
	if (this.frame != null)
	{
		this.frame.contentWindow.postMessage(JSON.stringify(msg), '*');
	}
};

/**
 * Returns the diagram data.
 */
DiagramEditor.prototype.getData = function()
{
	return this.data;
};

/**
 * Returns the title for the editor.
 */
DiagramEditor.prototype.getTitle = function()
{
	return this.title;
};

/**
 * Returns the CSS style for the iframe.
 */
DiagramEditor.prototype.getFrameStyle = function()
{
	return this.frameStyle + ';left:' +
		document.body.scrollLeft + 'px;top:' +
		document.body.scrollTop + 'px;';
};

/**
 * Returns the URL for the iframe.
 */
DiagramEditor.prototype.getFrameUrl = function()
{
	var url = this.drawDomain + '?embed=1&proto=json&spin=1';

	if (this.ui != null)
	{
		url += '&ui=' + this.ui;
	}

	if (this.libraries != null)
	{
		url += '&libraries=1';
	}

	if (this.config != null)
	{
		url += '&configure=1';
	}

	return url;
};

/**
 * Creates the iframe.
 */
DiagramEditor.prototype.createFrame = function(url, style)
{
    this.frameName = 'drawio-frame-' + Math.random();
	var frame = document.createElement('iframe');
	frame.setAttribute('frameborder', '0');
	frame.setAttribute('style', style);
    frame.setAttribute('src', url);
    frame.setAttribute('name', this.frameName);

    var className = this.className || '';
    
    if (this.className) {
        frame.setAttribute('class', className);
    }

	return frame;
};

/**
 * Sets the status of the editor.
 */
DiagramEditor.prototype.setStatus = function(messageKey, modified)
{
	this.postMessage({action: 'status', messageKey: messageKey, modified: modified});
};

/**
 * Handles the given message.
 */
DiagramEditor.prototype.handleMessage = function(msg)
{
	if (msg.event == 'configure')
	{
		this.configureEditor();
	}
	else if (msg.event == 'init')
	{
		this.initializeEditor();
	}
	else if (msg.event == 'autosave')
	{
		this.save(msg.xml, true, this.startElement);
	}
	else if (msg.event == 'export')
	{
		this.save(msg.data, false, this.startElement);
		this.stopEditing();
	}
	else if (msg.event == 'save')
	{
		if (msg.exit)
		{
			msg.event = 'exit';
		}
		else
		{
			this.setStatus('allChangesSaved', false);
		}
	}

	if (msg.event == 'exit')
	{
		if (this.format != 'xml' && !msg.modified)
		{
			this.postMessage({action: 'export', format: this.format,
				xml: msg.xml, spinKey: 'export'});
		}
		else
		{
			this.save(msg.xml, false, this.startElement);
			this.stopEditing(msg);
		}
	}
};

/**
 * Posts configure message to editor.
 */
DiagramEditor.prototype.configureEditor = function()
{
	this.postMessage({action: 'configure', config: this.config});
};

/**
 * Posts load message to editor.
 */
DiagramEditor.prototype.initializeEditor = function()
{
	this.postMessage({action: 'load',autosave: 1, saveAndExit: '1',
		modified: 'unsavedChanges', xml: this.getData(),
		title: this.getTitle()});
	this.setWaiting(false);
	this.setActive(true);
};

/**
 * Saves the given data.
 */
DiagramEditor.prototype.save = function(data, draft, elt)
{
	if (elt != null && !draft)
	{
		this.setElementData(elt, data);
		this.done(data, draft, elt);
	}
};

/**
 * Invoked after save.
 */
DiagramEditor.prototype.done = function()
{
	// hook for subclassers
};

export default DiagramEditor;