goog.provide('postile.locale.en');
goog.provide('postile.locale.zh_CN');
goog.provide('postile.locale.zh_TW');

postile.locale.en.text = {
    inline_comment_prompt: 'Enter your comment here...',
    post_title_prompt: 'Title (optional)',
    post_zone_illegal: 'The zone you chose was illegal. Please reselect one.',
    mask_for_creating_post: 'Click & Drag to add a post. Press <i>Esc</i> or <i>double click again</i> to quit',
    mask_for_picking_post: 'Click to select a post to link to',
    linked: 'LINKED',
    submit_edit: 'Submit',
    drag_here: 'Drag Here'
};

postile.locale.en.date = {
    _month_constant: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    inline: function(date_obj) {
        return date_obj.getHours() + ':' +
               goog.string.padNumber(date_obj.getMinutes(), 2) + ' ' +
               postile.locale.en.date._month_constant[date_obj.getMonth()] +
               ' ' + date_obj.getDate();
    }
}

postile.locale.zh_CN.text = {
    inline_comment_prompt: '在此输入评论...',
    post_title_prompt: '标题（选填）',
    post_zone_illegal: '您选择的区域不合法。请重新选择',
    mask_for_creating_post: '拖拽发帖、双击返回',
    mask_for_picking_post: '请点击选择要链接的帖子',
    linked: '已链接',
    submit_edit: '保存更改',
    drag_here: '拖拽至此处'
};

postile.locale.zh_CN.date = {
    inline: function(date_obj) { return (date_obj.getMonth() + 1) + '月' + date_obj.getDate() + '日 ' + date_obj.getHours() + ':' + goog.string.padNumber(date_obj.getMinutes(), 2); }
}

postile.locale.zh_TW.text = {
    inline_comment_prompt: '在此鍵入評論...',
    post_title_prompt: '標題（可選）',
    post_zone_illegal: '這尼瑪不可以的……重新選擇區域去！',
    mask_for_creating_post: '拖拽創建新post、雙擊返回瀏覽',
    mask_for_picking_post: '請點擊選擇要鏈接的帖子',
    linked: '已鏈接',
    submit_edit: '保存更改',
    drag_here: '拖拽至此處'
};

postile.locale.zh_TW.date = {
    inline: function(date_obj) { return (date_obj.getMonth() + 1) + '月' + date_obj.getDate() + '日 ' + date_obj.getHours() + ':' + goog.string.padNumber(date_obj.getMinutes(), 2); }
}
