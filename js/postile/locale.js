goog.provide('postile.locale.en');
goog.provide('postile.locale.zh_CN');
goog.provide('postile.locale.zh_TW');

postile.locale.en.text = {
    inline_comment_prompt: 'Enter your comment here...',
    post_title_prompt: 'Title (optional)',
    post_zone_illegal: 'The zone you choosed was illegal. Please reselect one.'
};

postile.locale.en.date = {
    _month_constant: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    inline: function(date_obj) { return date_obj.getHours() + ':' + goog.string.padNumber(date_obj.getMinutes(), 2) + ' ' + this._month_constant[date_obj.getMonth()] + ' ' + date_obj.getDate(); }
}

postile.locale.zh_CN.text = {
    inline_comment_prompt: '在此输入评论...',
    post_title_prompt: '标题（选填）',
    post_zone_illegal: '您选择的区域不合法。请重新选择'
};

postile.locale.zh_CN.date = {
    inline: function(date_obj) { return (date_obj.getMonth() + 1) + '月' + date_obj.getDate() + '日 ' + date_obj.getHours() + ':' + goog.string.padNumber(date_obj.getMinutes(), 2); }
}

postile.locale.zh_TW.text = {
    inline_comment_prompt: '在此鍵入評論...',
    post_title_prompt: '標題（可選）',
    post_zone_illegal: '這尼瑪不可以的……重新選擇區域去！'
};

postile.locale.zh_TW.date = {
    inline: function(date_obj) { return (date_obj.getMonth() + 1) + '月' + date_obj.getDate() + '日 ' + date_obj.getHours() + ':' + goog.string.padNumber(date_obj.getMinutes(), 2); }
}