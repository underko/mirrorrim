/*
Copyright © imhd.sk, 2016
All rights reserved. Všetky práva vyhradené.
Akékoľvek použitie bez súhlasu majiteľov autorských práve je zakázané.
*/
var riadky;
var hodiny = true;
var klimatizovane = false;
var vozidlaInfo = false;
var maxriadky;
var api_url;
var web;
var zastavka = null;
var lZastavka = null;
var lat = null;
var lng = null;
var zastavkaNazov = '';
var nastupiste = [];
var nastupiste_oznacenie = [];
var poradie = null;
var riadokVyska = null;
var convertLid = [];
convertLid[">"] = "_E";
convertLid["111"] = "Vianoce";
var convertL = [];
convertL[">"] = "►";
convertL["111"] = '<span class="symbol">*</span>';
var maxTimeMin = 15;
var minTimeShow = 2 * 60;	// min
var maxTimeShow = 30 * 60;	// min
var minRowShow = 4;
var scroll = 1;

var ciele = [];
var vozidla = [];
var korekcia = null;
var tabula = [];
var idh = null;
var logobarHover;
var infoHref;
var vypinat = 1;
var minDisp = 0;
var topL = [];
var t = {};
var spinner = ' <div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';

var connected = null;
var countDown;
var logobarOriginal;
var title = document.title;

var sio_connection=undefined;
var sios = '';
var resource = '/rt/sio';
var reconnectTimer;
var vypnutieTimeout;
var infoTimeout;
var ltime = null;

var cyklus = [];
var cyklusn = 0;
var cyklusID;
var cyklusPrvy = true;

var gpsOptions = {
	enableHighAccuracy: true,
	timeout: 60000,
	maximumAge: 60000
};

function showError(text) {
	$("#chybaPozadie").show();
	$("#chyba").html(text).show();
}

function hideError() {
	$("#chybaPozadie").hide();
	$("#chyba").hide();
}

function SIO(f,g) {
    var s,z,n,p=true,le="Spojenie zatiaľ nie je nadviazané";s=z=n=undefined;
    function sd(){s.disconnect();s.io.reconnecting=false;};
    this.start = function(zp,np) {
				if(zp&&np) {z=zp;n=np; chzn();}
        if(!s) {
			console.log("sios: "+sios+", resource: "+resource+", f: "+f+", g: "+g+", io: "+io);
            s=io.connect(sios,{path: resource})
                .on('tab',function(d){if(p)g(true);p=false;f(d);}).on('connect',function(){p=true;le="";chzn();})
                .on('disconnect',function(){g(false);if(le=="")le="Spojenie prerušené"}).on('error',function(e){e=""+e;le=e[0]=='@'?e.slice(1):"";})
                .on('cack',function(d){if(d===true)return;le=d;sd();});
        } else s.connect();
    };
		function chzn() {if(s&&s.connected)s.emit('req',[z,n]);};
    this.stop = function(){if(s)sd();};
		this.lastError = function(){return le;}
}

function gpsDistance(lat1, lon1, lat2, lon2) {
	var R = 6371009;
	var dLat = deg2rad(lat2 - lat1);
	var dLon = deg2rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180);
}

function GetLocation(location) {
	if (vypnutieTimeout)
		return;
	if ((lat != null) && (lng != null) && (gpsDistance(location.coords.latitude, location.coords.longitude, lat, lng) < 10))
		return;
	lat = location.coords.latitude;
	lng = location.coords.longitude;
	var dt = new Date();
	$.getJSON(api_url + "op=gns&lat=" + (lat) + "&lng=" + (lng) + (poradie != null ? "&poradie=" + poradie : "") + "&t=" + dt.getTime(), function(dataS) {
		if ((dataS != undefined) && (dataS.z != undefined)) {
			vzdialenost = dataS.vzdialenost;
			zastavkaNazov = dataS.nazov + (vzdialenost ? ' <span style="text-transform: none; font-size: 80%">(' + vzdialenost + ')</span>' : '');
			if (zastavka != dataS.z) {
				zastavka = dataS.z;
				nastupiste = dataS.n;
				nastupiste_oznacenie = dataS.oznacenie;
				hideError();
				connected = null;
				tabula = [];
				idh = null;
				cyklusn = 0;
				cyklusPrvy = true;

				if ((typeof(sio_connection) != undefined) && (sio_connection != null)) {
					sio_connection.start(zastavka, nastupiste);
				} else {
					initTab(zastavka, nastupiste);
				}
			}
			else if (zastavka == lZastavka) {
				$('#zNazov').html(zastavkaNazov + ((nastupiste.length == 1) && (nastupiste_oznacenie != null) && (nastupiste_oznacenie[nastupiste[0]] != undefined) ? '<br /><span class="zNazovNast">' + t.nastupiste + ' <strong>' + nastupiste_oznacenie[nastupiste[0]] + '</strong></span>' : ''));
				}
		} else {
			showError(t.zastavka_v_blizkosti_nenajdena);
		}
	});
}

function GetLocationError(error) {
	if (vypnutieTimeout)
		return;
	switch (error.code) {
		case error.PERMISSION_DENIED:
			text = t.neposkytnuta_geolocation;
			break;
		case error.POSITION_UNAVAILABLE:
			text = t.nedostupna_geolocation;
			break;
		case error.TIMEOUT:
			text = t.cas_geolocation_vyprsal;
			navigator.geolocation.watchPosition(GetLocation, GetLocationError, gpsOptions);
			break;
		case error.UNKNOWN_ERROR:
			text = t.chyba_pri_urcovani_geolocation;
			break;
		default:
			text = t.chyba_pri_urcovani_geolocation + ' #' + error.code + ': ' + error.message;
	}
	showError(text);
}

function showState() {
	showError("<strong>" + sio_connection.lastError() + '</strong>' + spinner);
	tabula = [];
	zobraz();
}

function initTab(z, n) {
	if (z == null) {
		if (navigator.geolocation) {
			showError(t.Hladam_najblizsiu_zastavku + spinner);
			navigator.geolocation.watchPosition(GetLocation, GetLocationError, gpsOptions);
		} else {
			showError(t.prehliadac_nepodporuje_geolocation);
		}
		return;
	}

	maxriadky = riadky;

	if (sio_connection==undefined) sio_connection = new SIO(
		function(data) {
			hideError();
			if (infoTimeout)
				clearTimeout(infoTimeout);
			if (reconnectTimer != undefined) {
				countDown = 10;
				clearTimeout(reconnectTimer);
			}

			if (data.zastavka==zastavka) {
				if (korekcia == null) {
					teraz = new Date().getTime();
					korekcia = data.timestamp - teraz;
				}

				if (data.tab.length > 0)
					$.each(data.tab, function(i, e) {
						data.tab[i].nastupiste = data.nastupiste;
						data.tab[i].timestamp = data.timestamp;
						data.tab[i].korekcia = korekcia;
					});
				tabula[data.nastupiste] = data.tab;
				initCiele();
				initVozidla();
				zobraz();
			}
		},
		function(state) {
			connected = (state?1:0);
			if (state == false) {
				if (!infoTimeout)
					infoTimeout = setTimeout(function() {
						showState();
					}, 10000);
				if (reconnectTimer != undefined) {
					clearTimeout(reconnectTimer);
					countDown = 10;
					reconnectTimer = setTimeout(reconnectTab, 13000);
				}
			} else if (sio_connection.lastError()!="") {
				showState();
				if (reconnectTimer != undefined) {
					clearTimeout(reconnectTimer);
					countDown = 10;
					reconnectTimer = setTimeout(reconnectTab, 3000);
				}
			}
		}
	);

	sio_connection.start(z,n);
}

function reconnectTab() {
	if (countDown > 0) {
		reconnectTimer = setTimeout(reconnectTab, 1000);
		showError(t.Opatovne_pripojenie + " " + countDown + " s");
	} else {
		showError(t.Pripajam_sa + spinner);
		initTab(zastavka, nastupiste);
	}
	countDown--;
}

function updateClock() {
  if (minDisp) return;
	setTimeout(updateClock, 1000);

	var currentTime = new Date();
	currentTime.setTime(currentTime.getTime() + korekcia);
	var currentHours = currentTime.getHours();
	var currentMinutes = currentTime.getMinutes();
	var currentSeconds = currentTime.getSeconds();

	if ((currentSeconds == 3) || (currentTime - ltime > 60000))
		zobraz();
	ltime = currentTime;

	if (hodiny) {
		currentHours = lz(currentHours, 2);
		currentMinutes = lz(currentMinutes, 2);
		currentSeconds = lz(currentSeconds, 2);

		var currentTimeString = currentHours + ":" + currentMinutes + '<span id="sekundy">:' + currentSeconds + "</span>";

		$("#hodiny").html(currentTimeString);
	}
}

function lz(number, length) {
	var str = "" + number;
	while (str.length < length) {
		str = "0" + str;
	}

	return str;
}

function initCiele() {
	var tab = $.map(tabula, function(v, k) {
		return v;
	});
	var nove = "";
	var pozadovane = [];
	n = 0;

	if ((typeof ciele === "undefined") || (!ciele.hasOwnProperty(zastavka))) {
		nove += zastavka + ",";
		n++;
	}

	for (i = 0; i < tab.length; i++)
		if ((typeof ciele === "undefined") || (!ciele.hasOwnProperty(tab[i].ciel))) {
			if (!pozadovane[tab[i].ciel]) {
				if (n < 45) {
					nove += tab[i].ciel + ",";
					pozadovane[tab[i].ciel] = 1;
				}
				n++;
			}
		}

	if (nove != "") {
		var dt = new Date();
		nove = nove.substring(0, nove.length - 1);
		console.log("api_url: "+api_url);
		if (api_url.search("https") == -1)
			api_url = "https://imhd.sk"+api_url;
		$.getJSON(api_url + "op=gsn&id=" + nove + "&t=" + dt.getTime(), function(dataC) {
			if (dataC != null)
				ciele = $.extend(ciele, dataC.sn);
			zobraz();
			zobraz_posledny_riadok(0);
		});
	}
}

function initVozidla() {
	if (!vozidlaInfo)
		return;

	var tab = $.map(tabula, function(v, k) {
		return v;
	});
	var nove = "";
	for (i = 0; i < tab.length; i++)
		if ((tab[i].typ == "online") && ((typeof vozidla === "undefined") || (!vozidla.hasOwnProperty(tab[i].issi))))
			nove += tab[i].issi + ",";

	if (nove != "") {
		var t = new Date();
		nove = nove.substring(0, nove.length - 1);
		$.getJSON(api_url + "op=gvt&id=" + nove + "&t=" + t.getTime(), function(dataC) {
			if (dataC != null) {
				vozidla = $.extend(vozidla, dataC.vt);
			}
			zobraz();
			zobraz_posledny_riadok(0);
		});
	}
}

function zobraz_polozku(el, html, anim) {
	if (typeof(anim) === 'undefined') a = 1;
	anim = 0;
	element = el + ">span";
	if ((anim == 2) || ((anim == 1) && ($(element).html() != html))) {
		if (idh != null)
			$("#info").html($("#" + idh).attr("tip"));
		else
			$("#info").hide();
		$(element).fadeOut(function() {
			$(this).html(html);
		}).fadeIn();
	} else if ($(element).html() != html) {
		if (idh != null)
			$("#info").html($("#" + idh).attr("tip"));
		else
			$("#info").hide();
		$(element).html(html);
	}
}

function zobraz_posledny_riadok(increment) {
	i = (riadky - 1);
	if (cyklus[cyklusn] == undefined)
		if (cyklus[0] == undefined)
			return;
		else
			cyklusn = 0;

	if (cyklusPrvy) {
		anim = 0;
		cyklusPrvy = false;
	} else
		anim = 2;

	if (cyklus[cyklusn].S.length > 25)
		$("#riadok" + i + "S").addClass("cond");

	zobraz_polozku("#riadok" + i + "L", cyklus[cyklusn].L, anim);
	zobraz_polozku("#riadok" + i + "S", cyklus[cyklusn].S, anim);
	zobraz_polozku("#riadok" + i + "C", cyklus[cyklusn].C, anim);
	if (cyklus.length == 1)
		zobraz_polozku("#riadok" + i + "X", cyklus[cyklusn].X, anim);
	else
		zobraz_polozku("#riadok" + i + "X", '...', anim);

	if (cyklus[cyklusn].S.length <= 25)
		$("#riadok" + i + "S").removeClass("cond");

	if (cyklus[cyklusn].online == "online")
		$("#riadok" + i).removeClass("offline");
	else if (!$("#riadok" + i).hasClass("offline"))
		$("#riadok" + i).addClass("offline");
	$("#riadok" + i).attr("tip", cyklus[cyklusn].tip);
	$("#info").html($("#" + idh).attr("tip"));

	if (increment)
		cyklusn = (cyklusn + 1) % cyklus.length;
}

function zobraz() {

	var tab = $.map(tabula, function(v, k) {
		return v;
	});

	if ((typeof tab === "undefined") || (tab == null)) {
		return;
	}

	// cielove zastavky smerom z mesta

	var not_city = ["OD Slimák", "Astronomická"];
	var currentTime = new Date();
	var teraz = currentTime.getTime();

	tab.sort(function(a, b) {

		aTop = ($.inArray(a.linka, topL) < 0 ? 0 : 1);
		bTop = ($.inArray(b.linka, topL) < 0 ? 0 : 1);
		var aCas = Math.floor(a.cas / 60000) - Math.floor((teraz + a.korekcia) / 60000); // Zaokruhlenie na 10 s
		var bCas = Math.floor(b.cas / 60000) - Math.floor((teraz + b.korekcia) / 60000); // Zaokruhlenie na 10 s
//		var bCas = Math.floor( (b.cas - b.korekcia) / 60000);
		return ((aTop == bTop) ? ((aCas == bCas) ? (a.casDelta < b.casDelta ? 1 : (a.linka > b.linka ? 1 : -1) ) : (aCas > bCas) ? 1 : -1) : (aTop < bTop ? 1 : -1));
	});

	cyklus = [];
	cyklusi = 0;
	neobmedzovat = 0;
	n = 0;

	if (zastavka != lZastavka) {
		$('#zNazov').html(zastavkaNazov + ((nastupiste.length == 1) && (nastupiste_oznacenie != null) && (nastupiste_oznacenie[nastupiste[0]] != undefined) ? '<br /><span class="zNazovNast">' + t.nastupiste + ' <strong>' + nastupiste_oznacenie[nastupiste[0]] + '</strong></span>' : ''));
		document.title = $('#zNazov').text() + " • " + title;
		if (!minDisp)
			$("#tabulaDiv").css("padding-top", $("#topDiv").css("height"));
		lZastavka = zastavka;
		}

	for (i = 0; i < tab.length; i++) {
		var d = new Date(tab[i].cas);
		var cas = Math.floor(tab[i].cas / 60000) - Math.floor((teraz + tab[i].korekcia) / 60000);
		casHM = d.toTimeString().replace(/(\d{2}:\d{2}).*/, "$1");

		// cas = '<span class="blink1">&lt1&nbsp;min</span><span class="blink2"></span>';

		if (cas < -15) { cas = false; }
		else if (cas < 1) { cas = "&lt1&nbsp;min"; }
		else if (cas < 2) { cas = "~1&nbsp;min"; }
		else {
			if (cas <= (maxTimeMin + 1))
				cas = (cas - 1) + "&nbsp;min";
			else if (cas <= minTimeShow)
				cas = casHM;
			else if ((cas <= maxTimeShow) && (i < riadky))
				cas = casHM;
			else if ((i < minRowShow) || ((neobmedzovat) && (cas <= maxTimeShow))) {
				cas = casHM;
				neobmedzovat = 1;
			} else {
				cas = false;
			}
			if ((tab[i].typ != "online") && (cas != false))
				cas = "~" + cas;
		}

		if (cas != false) {
			colL = $('<div/>').html('<span class="linka ' + web + ' l' + (convertLid[tab[i].linka] != undefined ? convertLid[tab[i].linka] : tab[i].linka) + '">' + (convertL[tab[i].linka] != undefined ? convertL[tab[i].linka] : tab[i].linka) + '</span>').html();
			//if ((typeof ciele !== "undefined") && (typeof ciele[tab[i].ciel] !== "undefined")) {
				colS = $('<div/>').html(ciele[tab[i].ciel]).html();
<<<<<<< HEAD
			}
			else {
				colS = "";
			}
=======
				console.log("colS: " + colS + "ciele: " + ciele + "tab[i].ciel: " + tab[i].ciel + "tab[i].ciel: " + ciele[tab[i].ciel]);

				var found_match = false;

				for (var i = 0; i < not_city.length; i++) {
					if (colS.includes(not_city[i])) {
						colS = '<img src="./resource/city.png" width="48px">' + colS;
						found_match = true;
						break;
					}
				}

				if (!found_match) {
					colS = "   " + colS;
				}
			//}
			//else {
			//	colS = "";
			//}
>>>>>>> d5d0a4de762cf0100d406e0e7d04f2a66e0dd627

			colX = "";
			if ((tab[i].typ == "online") && (typeof vozidla !== "undefined") && (vozidla[tab[i].issi] != undefined)) {
				if (klimatizovane)
					colX += (vozidla[tab[i].issi].ac == 1 ? '<span class="symbol">*</span>' : "");
				colX += (vozidla[tab[i].issi].np == 1 ? '<span class="symbol"><img src="./resource/stroller.png" width="48px"></span>' : "");
				}
			if ((nastupiste.length > 1) && (nastupiste_oznacenie != null) && (nastupiste_oznacenie[tab[i].nastupiste] != undefined))
				colX += '<span class="nastupiste">' + nastupiste_oznacenie[tab[i].nastupiste] + '</span>';

			var odchylkaClass = "";
			if (tab[i].casDelta >= 4)
				odchylkaClass = "meskanie3";
			else if (tab[i].casDelta >= 2)
				odchylkaClass = "meskanie2";
			else if (tab[i].casDelta > 0)
				odchylkaClass = "meskanie1";
			else if (tab[i].casDelta < 0)
				odchylkaClass = "nadbeh";

			if (tab[i].typ == "online") {
				tip = '<div class="l"><span class="linka ' + web + ' l' + (convertLid[tab[i].linka] != undefined ? convertLid[tab[i].linka] : tab[i].linka) + '">' + (convertL[tab[i].linka] != undefined ? convertL[tab[i].linka] : tab[i].linka) + '</span>' +
				(((typeof ciele !== "undefined") && (typeof ciele[tab[i].ciel] !== "undefined")) ? " ► " + ciele[tab[i].ciel] : "") +
				'<br /><strong>' +
				t.Ocakavany_odchod + ": " + casHM + "</strong>" + (tab[i].casDelta < 0 ? '<br /><span class="' + odchylkaClass + '">' + t.v_predstihu + " " + (tab[i].casDelta * -1) + " min</span>" : (tab[i].casDelta > 0 ? '<br /><span class="' + odchylkaClass + '">' + t.meska + " " + tab[i].casDelta + " min</span>" : "")) + "</div>";
				if ((typeof vozidla !== "undefined") && (vozidla[tab[i].issi] != undefined))
					tip += '<div class="r">' +
					vozidla[tab[i].issi].img +
					(vozidla[tab[i].issi].aktualna_suprava && !vozidla[tab[i].issi].uimg ? vozidla[tab[i].issi].img : "") + '<br />' +
					vozidla[tab[i].issi].typ +
					(vozidla[tab[i].issi].aktualna_suprava ? " #" + vozidla[tab[i].issi].aktualna_suprava : " #" + tab[i].issi) +
					'</div>';
			} else
				tip = '<div class="l"><span class="linka ' + web + ' l' + (convertLid[tab[i].linka] != undefined ? convertLid[tab[i].linka] : tab[i].linka) + '">' + (convertL[tab[i].linka] != undefined ? convertL[tab[i].linka] : tab[i].linka) + '</span>' +
				(((typeof ciele !== "undefined") && (typeof ciele[tab[i].ciel] !== "undefined")) ? " ► " + ciele[tab[i].ciel] : "") +
				'<br /><strong>' + t.Odchod_CP + ": " + casHM + '</strong></div>';

			if ((n == 0) || (n < riadky)) {
				if ((n < riadky - 1) || (cyklusID == undefined) || (n == 0)) {

					if (colS.length > 25)
						$("#riadok" + n + "S").addClass("cond");

					zobraz_polozku("#riadok" + n + "L", colL, 1);
					zobraz_polozku("#riadok" + n + "S", colS, 1);
					zobraz_polozku("#riadok" + n + "C", cas, 1);
					zobraz_polozku("#riadok" + n + "X", colX, 1);

					if (colS.length <= 25)
						$("#riadok" + n + "S").removeClass("cond");

					if (tab[i].typ == "online")
						$("#riadok" + n).removeClass("offline");
					else if (!$("#riadok" + n).hasClass("offline"))
						$("#riadok" + n).addClass("offline");

					$("#riadok" + n).attr("tip", tip);
					$("#riadok" + n).show();

					if (n == 0) {
						lriadky = riadky;
						var pos = $("#logobar").offset();
						var m = parseInt(pos.top);
						m = 0;

						$("#riadok0").height("auto");
						riadokVyska = $("#riadok0").outerHeight();

						wh = $(window).height();
						h1h = $("#hlavicka").outerHeight();
						h2h = $("#logobar").outerHeight();
						m = parseFloat($("#tabulaDiv").css("paddingLeft"));

						if (riadokVyska > 0)
							riadky = Math.min(maxriadky, Math.max(1, Math.floor((wh - h1h - h2h - m) / riadokVyska)));

						if (scroll)
					 		riadky = Math.max(riadky, tab.length);

						rh1 = Math.floor((wh - h1h - h2h - m) / riadky);
						for (j = riadky; j < lriadky; j++) {
							$("#riadok" + j).fadeOut();
						}
						for (j = 0; j < riadky; j++) {
							$("#riadok" + j).height(rh1);
						}
					}
				}
				n++;
			}
			if (n >= riadky) {
				cyklus[cyklusi] = [];
				cyklus[cyklusi].L = colL;

				console.log("colS: " + colS + ", ciele: " + ciele + ", tab[i].ciel: " + tab[i].ciel + ", tab[i].ciel: " + ciele[tab[i].ciel]);

				var found_match = false;

				for (var i = 0; i < not_city.length; i++) {
					if (colS.includes(not_city[i])) {
						colS = '<img src="./resource/city.png" width="48px">' + colS;
						found_match = true;
						break;
					}
				}

				if (!found_match) {
					colS = "   " + colS;
				}

				cyklus[cyklusi].S = colS;
				cyklus[cyklusi].C = cas;
				cyklus[cyklusi].X = colX;
				cyklus[cyklusi].tip = tip;
				cyklus[cyklusi].online = tab[i].typ;
				cyklusi++;
			}
		}
	}
	if (riadky > n)
		for (i = n; i < riadky; i++)
			$("#riadok" + i).hide();

	if ((n == 0) && (connected != null)) {
		zobraz_polozku("#riadok" + n + "L", "", 1);
		zobraz_polozku("#riadok" + n + "S", (connected == 1 ? t.Zastavka_neobsluhovana : t.statusX), 1);
		zobraz_polozku("#riadok" + n + "C", "", 1);
		zobraz_polozku("#riadok" + n + "X", "", 1);
		$("#riadok" + n).attr("tip", "");
		$("#riadok" + n).show();
	}

	if (cyklus.length == 1) {
		i = riadky - 1;
		cyklusn = 0;
		zobraz_polozku("#riadok" + i + "L", cyklus[cyklusn].L, 1);
		zobraz_polozku("#riadok" + i + "S", cyklus[cyklusn].S, 1);
		zobraz_polozku("#riadok" + i + "C", cyklus[cyklusn].C, 1);
		zobraz_polozku("#riadok" + i + "X", cyklus[cyklusn].X, 1);
		if (cyklus[cyklusn].online == "online")
			$("#riadok" + i).removeClass("offline");
		else if (!$("#riadok" + i).hasClass("offline"))
			$("#riadok" + i).addClass("offline");
		$("#riadok" + i).attr("tip", cyklus[cyklusn].tip);
		$("#riadok" + i).show();
	} else if (cyklus.length > 1) {
		$("#riadok" + (riadky - 1)).show();
		if ((cyklusID == undefined) || (cyklusID == false)) {
			cyklusPrvy = true;
			zobraz_posledny_riadok(1);
			cyklusID = setInterval('zobraz_posledny_riadok(1)', 5000);
		}
	}
}
$(document).ready(function() {
	if (!minDisp)
		$("#tabulaDiv").css("padding-top", $("#topDiv").css("height"));
	updateClock();

	function resizeend() {
		if (cyklusID != undefined) {
			clearInterval(cyklusID);
			cyklusID = false;
		}
		if (tabula !== undefined)
			zobraz(tabula);
		var h = $("#hlavicka").outerHeight() + $("#logobar").outerHeight();
		$("#info").css({
			top: 0,
			left: 0,
			"min-height": h + "px"
		});
	}

	var doit;
	$(window).resize(function() {
		clearTimeout(doit);
		doit = setTimeout(resizeend, 200);
	});

	function zobrazInfo() {
		if ($("#" + idh).attr("tip")) {
			$("#info").html($("#" + idh).attr("tip"));
			$("#info").show();
			clearTimeout(infoTimer);
			infoTimer = setTimeout(function() {
				$("#info").slideUp();
			}, 10000);
		}
	}

	var infoTimer;
	var h = $("#hlavicka").outerHeight() + $("#logobar").outerHeight();
	$("#info").css({
		top: 0,
		left: 0,
		"min-height": h + "px"
	});
	$(".tooltip").mouseenter(function() {
		if (minDisp) return;
		var id = $(this).attr("id");
		id = id.substr(0, id.length - 1);
		idh = id;
		zobrazInfo();
	}).mousemove(function() {
		if ($('#info:hidden'))
			zobrazInfo();
	}).mouseleave(function() {
		idh = null;
		$("#info").hide();
	});

	logobarOriginal = $("#logobarInfo").html();

	$("#logobar").mouseenter(function() {
		if (minDisp) return;
		$("#logobarInfo").height($("#logobarInfo").height());
		$("#logobarInfo").html(logobarHover);
	});
	$("#logobar").mouseout(function() {
		if (minDisp) return;
		$("#logobarInfo").html(logobarOriginal);
		$('#zNazov').html(zastavkaNazov + ((nastupiste.length == 1) && (nastupiste_oznacenie != null) && (nastupiste_oznacenie[nastupiste[0]] != undefined) ? '<br /><span class="zNazovNast">' + t.nastupiste + ' <strong>' + nastupiste_oznacenie[nastupiste[0]] + '</strong></span>' : ''));
	});
	$("#logobar").click(function() {
		if (minDisp) return;
		document.location.href = infoHref;
	});

	function vypniTabulu() {
		if ((typeof(sio_connection) == undefined) || (sio_connection == null))
			return;
		sio_connection.stop();
		$("#infoNeaktivna").show();
		$("#info").hide();
		hideError();
		$("#tabula").hide();
	}

	$([window, document]).focusin(function() {	// refresh tabule pri obnove spojenia
		if ((typeof(sio_connection) == undefined) || (sio_connection == null))
			return;
		sio_connection.start();
		});

	if (vypinat) {
		$([window, document]).focusin(function() {
			if ((typeof(sio_connection) == undefined) || (sio_connection == null))
				return;
			if (reconnectTimer != undefined)
				clearTimeout(reconnectTimer);
			showError(t.Pripajam_sa + spinner);
			if (vypnutieTimeout)
				clearTimeout(vypnutieTimeout);
			$("#infoNeaktivna").hide();
			sio_connection.start();
			$("#tabula").show();
			zobraz();
		}).focusout(function() {
			vypnutieTimeout = setTimeout(vypniTabulu, 1000);
		});
	}

	$(window).unload(function() {
		if ((typeof(sio_connection) != undefined) && (sio_connection != null)) sio_connection.stop();
	});
});