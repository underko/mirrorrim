function get_date() {
        months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'Jully', 'August', 'September', 'October', 'November', 'December');
        days = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

        date = new Date;
        year = date.getFullYear();
        month = date.getMonth();
        day_num = date.getDate();
        day = date.getDay();
        
        
        result = '' + days[day] + ', ' + months[month] + ' ' + day_num + ' ' + year;
        return result;
}

function get_time() {
        date = new Date;
        
        h = date.getHours();
        if(h < 10) { h = "0" + h; }

        m = date.getMinutes();
        if(m < 10) { m = "0" + m; }
        
        s = date.getSeconds();
        if(s < 10) { s = "0" + s; }

        result = '' + h + ':' + m + ':' + s;
        return result;
}

function get_datetime(id) {
        
        result  = '<h1>' + get_time() + '</h1></br>';
        result += '<h2>' + get_date() + '</h2>';

        document.getElementById(id).innerHTML = result;
        setTimeout('get_datetime("' + id + '");','1000');

        return true;
}