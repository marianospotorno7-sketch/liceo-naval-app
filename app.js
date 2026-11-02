'use strict';

// ============================================================================
// CONFIGURACIÓN — completar después de los pasos manuales (ver CONFIGURACION.md)
// ============================================================================
var CONFIG = {
  CLIENT_ID: '191749685889-0v8tsod2jdpm8le4icnp2lqc3545p9do.apps.googleusercontent.com',
  BACKEND_URL: 'https://script.google.com/macros/s/AKfycbw_QdHUyuXu6lmVXFWZdeYwW9sgz36yIEmRUHeSm4-eROFeWKFOzzwJ-lnfDSdr2661tQ/exec',
  FORM_INGRESO_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScy8TN1eog6jo0YIvow0ENvc03Nv-NldtVA-zJKgkRigTTfTg/viewform'
};

// Lista "de ranking": tiene que ser EXACTAMENTE la misma que RANKING_POTENCIA en el backend —
// de acá salen los chips de la pantalla Ranking.
var EJERCICIOS_POTENCIA = ['ARRANQUE', 'CARGADA'];
// Lista solo para la pantalla de Carga: lo mismo + Tirón de Arranque y Tirón de Cargada (pedido
// de Mariano, 29/10) — quedan guardados en la base pero no se muestran en Mis Datos ni Ranking.
var EJERCICIOS_POTENCIA_CARGA = ['ARRANQUE', 'TIRÓN DE ARRANQUE', 'CARGADA', 'TIRÓN DE CARGADA'];
// Lista "de ranking": tiene que ser EXACTAMENTE la misma que RANKING_FUERZA en el backend —
// de acá salen los chips de la pantalla Ranking.
var EJERCICIOS_FUERZA = ['SENTADILLA', 'PESO MUERTO', 'DESPEGUE', 'PRESS BANCA', 'PRESS HOMBRO', 'DOMINADAS'];
// Lista solo para la pantalla de Carga: lo mismo + ejercicios que el jugador puede cargar pero
// que no se muestran en Mis Datos ni en el Ranking (pedido de Mariano, 29/10: Sentadilla Media
// — el dato queda guardado en la base, simplemente no se ve en la app salvo al cargarlo).
var EJERCICIOS_FUERZA_CARGA = ['SENTADILLA', 'SENTADILLA MEDIA', 'PESO MUERTO', 'DESPEGUE', 'PRESS BANCA', 'PRESS HOMBRO', 'DOMINADAS'];
// Campo: tiene que ser EXACTAMENTE la misma lista que RANKING_CAMPO en el backend.
var EJERCICIOS_CAMPO = ['BRONCO', 'VEL MAX'];
// Unidad para mostrar cada ejercicio en Mis Datos y Ranking (todo lo que no está acá es 'kg').
var UNIDAD_EJ = {'SALTO HORIZONTAL': 'm', 'BRONCO': 's', 'VEL MAX': 'km/h'};
function unidadEj_(ej) { return UNIDAD_EJ[ej] || 'kg'; }
var CAMPO_ID = {
  'ARRANQUE': 'campoArranque', 'TIRÓN DE ARRANQUE': 'campoTironArranque', 'CARGADA': 'campoCargada',
  'TIRÓN DE CARGADA': 'campoTironCargada', 'SENTADILLA': 'campoSentadilla',
  'SENTADILLA MEDIA': 'campoSentadillaMedia', 'PESO MUERTO': 'campoPesoMuerto', 'DESPEGUE': 'campoDespegue',
  'PRESS BANCA': 'campoPressBanca', 'PRESS HOMBRO': 'campoPressHombro', 'DOMINADAS': 'campoDominadas'
};
// Nombres tal cual están en la base (no se tocan, serían decenas de miles de filas históricas)
// vs. cómo se muestran en la app. Pedido de Mariano (30/10): Press Banca y Press Pecho son el
// mismo ejercicio — se unifica mostrando siempre "Press de Pecho".
var ETIQUETAS = {'PRESS BANCA': 'PRESS DE PECHO'};
function etiqueta_(nombre) { return ETIQUETAS[nombre] || nombre; }

// Solo en la pantalla de Carga: lo que se anota como "Sentadilla" en la base es siempre
// sentadilla PROFUNDA — se aclara acá para que el jugador no cargue otra variante sin darse
// cuenta. Mis Datos y Ranking siguen mostrando "Sentadilla" como siempre.
var ETIQUETAS_CARGA = {'SENTADILLA': 'SENTADILLA PROFUNDA'};
function etiquetaCarga_(nombre) { return ETIQUETAS_CARGA[nombre] || etiqueta_(nombre); }

// Tiene que ser EXACTAMENTE la misma lista que ZONAS_LESION en el backend.
var ZONAS_LESION = ['Cabeza / conmoción', 'Cuello', 'Hombro', 'Brazo / codo', 'Mano / muñeca', 'Pecho / costillas',
  'Espalda / lumbar', 'Cadera / ingle', 'Muslo anterior (cuádriceps)', 'Muslo posterior (isquios)', 'Rodilla',
  'Pierna / gemelo', 'Tobillo', 'Pie', 'Otra'];
var CAMADAS_COACH = ['M15', 'M16', 'M17', 'M19', 'PLANTEL', 'G2 PS'];

var state = {token: null, demo: false, misDatos: null, ranking: null, rankingEj: 'ARRANQUE', avisos: null, esCoach: false,
  jugadoresLista: [], solicitudes: [], coachCamada: 'TODAS', coachPartidos: null};

function configLista_() {
  return CONFIG.CLIENT_ID.indexOf('PENDIENTE') < 0 && CONFIG.BACKEND_URL.indexOf('PENDIENTE') < 0;
}

// ---------------------------------------------------------------------------
// Datos de ejemplo — se usan solo si el backend todavía no está configurado,
// o si la llamada real falla, para poder ver y probar la interfaz mientras tanto.
// ---------------------------------------------------------------------------
function datosDemoMisDatos_() {
  var hoy = new Date();
  function serie(base, paso) {
    return [-60, -40, -20, -5].map(function (d, i) {
      var f = new Date(hoy); f.setDate(f.getDate() + d);
      return {fecha: f.toISOString(), valor: Math.round((base + i * paso) * 100) / 100};
    });
  }
  var ej = {};
  [['ARRANQUE', 55, 2.5], ['CARGADA', 70, 2.5], ['SENTADILLA', 110, 2.5], ['PESO MUERTO', 140, 2.5], ['DESPEGUE', 90, 2.5],
   ['PRESS BANCA', 85, 2.5], ['PRESS HOMBRO', 50, 2.5], ['DOMINADAS', 90, 2.5], ['SALTO HORIZONTAL', 2.3, 0.05],
   ['VEL MAX', 26, 0.3]].forEach(function (p) {
    var s = serie(p[1], p[2]);
    ej[p[0]] = {evolucion: s, actual: s[s.length - 1].valor, record: Math.max.apply(null, s.map(function (x) { return x.valor; })), fechaRecord: s[s.length - 1].fecha};
  });
  // Bronco: a diferencia del resto, el récord (y el mejor valor) es el MENOR, no el mayor.
  var sBronco = serie(320, -4);
  ej.BRONCO = {evolucion: sBronco, actual: sBronco[sBronco.length - 1].valor, record: Math.min.apply(null, sBronco.map(function (x) { return x.valor; })), fechaRecord: sBronco[sBronco.length - 1].fecha};
  return {
    nombre: 'Jugador de ejemplo', puesto: '06- TERCERA LINEA', cargasTotales: 42, cargasMes: 9, ejercicios: ej, pesoActual: 84.2, alturaActual: 181,
    partidos: {minutos: 220, partidos: 4, lesiones: 0, equipo: 'EQUIPO A', ultimo: {fecha: new Date(hoy.getTime() - 5 * 86400000).toISOString(), equipo: 'EQUIPO A', minutos: 60}},
    equiposPartido: ['EQUIPO A', 'EQUIPO B', 'EQUIPO C']
  };
}
function datosDemoRanking_() {
  // menor: el mejor valor es el más bajo (Bronco). conRel: si tiene sentido mostrar 1RM/peso
  // (no aplica a Campo: Bronco es tiempo, Vel Max es km/h, ninguno es un cociente contra el peso).
  function top(base, menor, conRel) {
    var nombres = ['Pérez Juan', 'Gómez Lucas', 'Fernández Tomás', 'Rodríguez Nico', 'Jugador de ejemplo', 'López Fede', 'García Iñaki'];
    return nombres.map(function (n, i) { var v = menor ? base + i * 4 : base - i * 4; return {nombre: n, v: v, rel: conRel ? v / 85 : null}; });
  }
  var out = {};
  EJERCICIOS_POTENCIA.concat(EJERCICIOS_FUERZA).concat(['SALTO HORIZONTAL']).forEach(function (e, i) {
    var t = top(100 - i * 3, false, true);
    out[e] = {club: t, camada: t.slice(0, 5), miPuestoClub: 5, miPuestoCamada: 3};
  });
  var tv = top(73, false, false);
  out['VEL MAX'] = {club: tv, camada: tv.slice(0, 5), miPuestoClub: 5, miPuestoCamada: 3};
  var tb = top(290, true, false);
  out.BRONCO = {club: tb, camada: tb.slice(0, 5), miPuestoClub: 5, miPuestoCamada: 3};
  return {nombre: 'Jugador de ejemplo', camada: 'M17', ranking: out};
}
function datosDemoAvisos_() {
  var hoy = new Date();
  return {
    esCoach: false, miCamada: 'M17', vistosHasta: null,
    cumpleanos: [{nombre: 'Gómez Lucas', fecha: new Date(hoy.getTime() + 2 * 86400000).toISOString(), hoy: false}],
    avisos: [
      {id: '1', fecha: new Date(hoy.getTime() - 3600000).toISOString(), autor: 'cuerpo técnico', destinoTipo: 'TODOS', texto: 'Mañana entrenamos 1 hora más temprano.'},
      {id: '2', fecha: new Date(hoy.getTime() - 86400000).toISOString(), autor: 'cuerpo técnico', destinoTipo: 'CAMADA', destinoValor: 'M17', texto: 'Buen laburo esta semana, M17.'}
    ],
    solicitudes: []
  };
}

// ---------------------------------------------------------------------------
// Login con Google
// ---------------------------------------------------------------------------
function iniciarGoogle(intentos) {
  intentos = intentos || 0;
  if (CONFIG.CLIENT_ID.indexOf('PENDIENTE') >= 0) {
    document.getElementById('loginMsg').textContent = 'El login con Google todavía no está configurado (falta el Client ID).';
    return;
  }
  if (!window.google || !window.google.accounts) {
    if (intentos > 40) { document.getElementById('loginMsg').textContent = 'No se pudo cargar el login de Google. Revisá tu conexión y recargá.'; return; }
    setTimeout(function () { iniciarGoogle(intentos + 1); }, 150);
    return;
  }
  google.accounts.id.initialize({client_id: CONFIG.CLIENT_ID, callback: onGoogleLogin_});
  google.accounts.id.renderButton(document.getElementById('gBtn'), {theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with'});
}

function onGoogleLogin_(resp) {
  state.token = resp.credential;
  try { localStorage.setItem('liceo_token', resp.credential); } catch (e) {}
  entrarAlApp_();
}

function salir_() {
  state.token = null; state.esCoach = false;
  try { localStorage.removeItem('liceo_token'); } catch (e) {}
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(function (t) { t.style.display = ''; });
}

// El token de Google dura ~1 hora. Si quedó uno viejo en localStorage, entrarAlApp_() lo usa
// igual (no hay forma de saber que venció sin preguntarle al backend) y recién ahí el backend
// lo rechaza. Antes ese rechazo cualquier error no reconocido se trataba como "modo demo" --
// el jugador terminaba viendo datos de ejemplo sin ningún botón para volver a entrar de verdad
// (iniciarGoogle() nunca se había llamado esa carga de página). Ahora se distingue ese caso
// puntual y se manda de nuevo a loguearse.
function sesionVencida_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu sesión venció, volvé a entrar con Google.';
  iniciarGoogle();
}

function entrarAlApp_() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  cargarMisDatos_();
}

// ---------------------------------------------------------------------------
// Llamadas al backend (Apps Script Web App). Si no está configurado o falla,
// se cae a los datos de ejemplo y se muestra el cartel de DEMO.
// ---------------------------------------------------------------------------
function backendGet_(action, params) {
  if (!configLista_()) return Promise.reject('sin-config');
  var url = CONFIG.BACKEND_URL + '?token=' + encodeURIComponent(state.token) + '&action=' + action;
  Object.keys(params || {}).forEach(function (k) { url += '&' + k + '=' + encodeURIComponent(params[k]); });
  return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
    if (j.error == 'SIN_VINCULAR') {
      if (j.esCoach) { entrarComoCoach_(); return Promise.reject('es-coach'); }
      mostrarSinVincular_(); return Promise.reject('sin-vincular');
    }
    if (j.error == 'PENDIENTE_APROBACION') { mostrarPendiente_(); return Promise.reject('pendiente'); }
    if (j.error == 'RECHAZADO') { mostrarRechazado_(); return Promise.reject('rechazado'); }
    if (j.error == 'No autorizado' && state.token != 'demo') { sesionVencida_(); return Promise.reject('no-autorizado'); }
    if (j.error) return Promise.reject(j.error);
    return j;
  });
}

function mostrarSinVincular_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu cuenta de Google todavía no está vinculada a un jugador.';
  var a = document.getElementById('ingresoLink');
  if (CONFIG.FORM_INGRESO_URL.indexOf('PENDIENTE') < 0) { a.href = CONFIG.FORM_INGRESO_URL; a.classList.remove('hidden'); }
}

// Ya completó el form de ingreso (está vinculado) pero el cuerpo técnico todavía no lo aprobó.
function mostrarPendiente_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu solicitud le llegó al cuerpo técnico y está esperando aprobación. En cuanto te aprueben, volvé a entrar con Google.';
}

function mostrarRechazado_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu solicitud fue rechazada. Si pensás que es un error, hablalo con el cuerpo técnico.';
}

// El coach (COACH_EMAILS en el backend) no tiene por qué tener fila de jugador: entra directo
// a Avisos, sin Mis Datos/Ranking/Carga (son datos de jugador que no tiene).
function entrarComoCoach_() {
  state.esCoach = true;
  document.getElementById('hNombre').textContent = 'Cuerpo técnico';
  document.getElementById('hCamada').textContent = 'Liceo Naval';
  document.querySelectorAll('.tab').forEach(function (t) {
    var pantalla = t.getAttribute('data-screen');
    t.style.display = (pantalla == 'Avisos' || pantalla == 'Ranking') ? '' : 'none';
  });
  irAPantalla_('Avisos');
  cargarAvisos_();
}

function marcarDemo_(si) { document.getElementById('demoBanner').classList.toggle('hidden', !si); state.demo = si; }

// Errores que ya muestran su propia pantalla (login) y no tienen que caer en modo demo.
var ERRORES_CON_PANTALLA_PROPIA = ['sin-vincular', 'es-coach', 'no-autorizado', 'pendiente', 'rechazado'];

function cargarMisDatos_() {
  backendGet_('misdatos').then(function (d) { marcarDemo_(false); state.esCoach = !!d.esCoach; renderMisDatos_(d); cargarAvisos_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; marcarDemo_(true); renderMisDatos_(datosDemoMisDatos_()); cargarAvisos_(); });
}

function cargarRanking_() {
  backendGet_('ranking').then(function (d) { marcarDemo_(false); state.ranking = d; renderRanking_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; marcarDemo_(true); state.ranking = datosDemoRanking_(); renderRanking_(); });
}

function cargarRankingCoach_() {
  backendGet_('rankingCoach', {camada: state.coachCamada}).then(function (d) { marcarDemo_(false); state.coachPartidos = d; renderCoachPartidos_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; /* sin demo para esta vista: solo la usa el coach */ });
}

function cargarAvisos_() {
  backendGet_('avisos').then(function (d) { marcarDemo_(false); state.avisos = d; state.jugadoresLista = d.jugadores || []; state.solicitudes = d.solicitudes || []; renderAvisos_(); actualizarBadge_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; marcarDemo_(true); state.avisos = datosDemoAvisos_(); state.jugadoresLista = []; state.solicitudes = []; renderAvisos_(); actualizarBadge_(); });
}

// ---------------------------------------------------------------------------
// Render: Mis Datos
// ---------------------------------------------------------------------------
function fmtFecha_(iso) {
  var d = new Date(iso); if (isNaN(d)) return '';
  return d.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit'});
}

function tarjetaEj_(nombre, d, unidad) {
  var div = document.createElement('div'); div.className = 'excard';
  var nameDiv = document.createElement('div'); nameDiv.className = 'exname'; nameDiv.textContent = etiqueta_(nombre);
  div.appendChild(nameDiv);
  if (!d) {
    var vacio = document.createElement('div'); vacio.className = 'exempty'; vacio.textContent = 'Sin cargas todavía';
    div.appendChild(vacio);
    return div;
  }
  var row = document.createElement('div'); row.className = 'exrow';
  var val = document.createElement('div'); val.className = 'exval';
  val.innerHTML = d.actual + ' <small>' + unidad + '</small>';
  var rec = document.createElement('div'); rec.className = 'exrecord';
  rec.textContent = 'Récord ' + d.record + ' ' + unidad + ' · ' + fmtFecha_(d.fechaRecord);
  row.appendChild(val); row.appendChild(rec);
  div.appendChild(row);
  return div;
}

function renderMisDatos_(d) {
  state.misDatos = d;
  document.getElementById('hNombre').textContent = d.nombre;
  document.getElementById('hCamada').textContent = d.puesto || '';
  document.getElementById('statTotal').textContent = d.cargasTotales;
  document.getElementById('statMes').textContent = d.cargasMes;
  document.getElementById('statPeso').textContent = d.pesoActual != null ? d.pesoActual : '—';
  document.getElementById('statAltura').textContent = d.alturaActual != null ? d.alturaActual : '—';
  document.getElementById('statPartidos').textContent = d.partidos ? d.partidos.partidos : 0;
  document.getElementById('statMinutos').textContent = d.partidos ? d.partidos.minutos : 0;

  var gp = document.getElementById('grupoPotencia'); gp.innerHTML = '';
  EJERCICIOS_POTENCIA.forEach(function (e) { gp.appendChild(tarjetaEj_(e, d.ejercicios[e], 'kg')); });

  var gf = document.getElementById('grupoFuerza'); gf.innerHTML = '';
  EJERCICIOS_FUERZA.forEach(function (e) { gf.appendChild(tarjetaEj_(e, d.ejercicios[e], 'kg')); });

  var gs = document.getElementById('grupoSalto'); gs.innerHTML = '';
  gs.appendChild(tarjetaEj_('SALTO HORIZONTAL', d.ejercicios['SALTO HORIZONTAL'], 'm'));

  var gc = document.getElementById('grupoCampo'); gc.innerHTML = '';
  EJERCICIOS_CAMPO.forEach(function (e) { gc.appendChild(tarjetaEj_(e, d.ejercicios[e], unidadEj_(e))); });
}

// ---------------------------------------------------------------------------
// Render: Ranking
// ---------------------------------------------------------------------------
function renderRankChips_() {
  var cont = document.getElementById('rankChips'); cont.innerHTML = '';
  EJERCICIOS_POTENCIA.concat(EJERCICIOS_FUERZA).concat(['SALTO HORIZONTAL']).concat(EJERCICIOS_CAMPO).forEach(function (e) {
    var b = document.createElement('button'); b.className = 'chip' + (e == state.rankingEj ? ' active' : '');
    b.textContent = etiqueta_(e); b.onclick = function () { state.rankingEj = e; renderRanking_(); };
    cont.appendChild(b);
  });
}

function tablaRanking_(lista, mePuesto, soyNombre, unidad) {
  var div = document.createElement('div');
  lista.forEach(function (r, i) {
    var row = document.createElement('div'); row.className = 'rankrow' + (i == 0 ? ' top1' : '') + (r.nombre == soyNombre ? ' me' : '');
    var pos = document.createElement('div'); pos.className = 'pos'; pos.textContent = (i + 1) + '°';
    var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = r.nombre;
    var vv = document.createElement('div'); vv.className = 'vv'; vv.textContent = r.v + ' ' + unidad;
    var rr = document.createElement('div'); rr.className = 'rr'; rr.textContent = r.rel ? r.rel.toFixed(2) + 'x' : '';
    row.appendChild(pos); row.appendChild(nm); row.appendChild(vv); row.appendChild(rr);
    div.appendChild(row);
  });
  return div;
}

function renderRanking_() {
  renderRankChips_();
  if (!state.ranking) return;
  var r = state.ranking.ranking[state.rankingEj];
  var unidad = unidadEj_(state.rankingEj);
  var nm = state.ranking.nombre;

  var cc = document.getElementById('rankCamada'); cc.innerHTML = ''; cc.appendChild(tablaRanking_(r.camada, r.miPuestoCamada, nm, unidad));
  document.getElementById('miPosCamada').textContent = r.miPuestoCamada ? 'Tu puesto en la camada: ' + r.miPuestoCamada + '°' : 'Todavía no tenés cargas de este ejercicio';

  var cl = document.getElementById('rankClub'); cl.innerHTML = ''; cl.appendChild(tablaRanking_(r.club, r.miPuestoClub, nm, unidad));
  document.getElementById('miPosClub').textContent = r.miPuestoClub ? 'Tu puesto en el club: ' + r.miPuestoClub + '°' : 'Todavía no tenés cargas de este ejercicio';
}

// ---------------------------------------------------------------------------
// Render: Partidos y lesiones (solo coach)
// ---------------------------------------------------------------------------
function renderCoachPartidos_() {
  var d = state.coachPartidos; if (!d) return;
  var sel = document.getElementById('coachCamada');
  if (sel.value !== state.coachCamada) sel.value = state.coachCamada;

  var faltanBox = document.getElementById('coachFaltanBox'); faltanBox.innerHTML = '';
  if (d.faltan && d.faltan.length) {
    var t1 = document.createElement('div'); t1.className = 'exgroup-title'; t1.textContent = '⚠️ No cargaron partido (' + d.faltan.length + ')';
    faltanBox.appendChild(t1);
    d.faltan.forEach(function (f) {
      var div = document.createElement('div'); div.className = 'avisocard';
      div.innerHTML = '<div class="meta">' + f.camada + '</div><div class="texto">' + f.nombre + (f.ultimo ? ' — último: ' + fmtFecha_(f.ultimo) : ' — nunca cargó') + '</div>';
      faltanBox.appendChild(div);
    });
  }

  var infBox = document.getElementById('coachInformeBox'); infBox.innerHTML = '';
  var t2 = document.createElement('div'); t2.className = 'exgroup-title'; t2.textContent = '📋 Informe de partidos';
  infBox.appendChild(t2);
  if (!d.informe || !d.informe.length) { infBox.innerHTML += '<div class="exempty">Sin jugadores en esta camada.</div>'; }
  (d.informe || []).forEach(function (r) {
    var div = document.createElement('div'); div.className = 'excard';
    var porEquipoTxt = Object.keys(r.porEquipo || {}).map(function (e) { return e + ': ' + r.porEquipo[e].p + 'p/' + r.porEquipo[e].m + 'min'; }).join(' · ');
    div.innerHTML = '<div class="exname">' + r.nombre + '</div>' +
      '<div class="exrow"><div class="exval">' + r.partidos + ' <small>partidos</small></div><div class="exrecord">' + r.minutos + ' min · prom ' + r.promedio + '</div></div>' +
      (porEquipoTxt ? '<div class="lastmark" style="margin-top:6px;">' + porEquipoTxt + '</div>' : '') +
      (r.lesiones ? '<div class="lastmark" style="color:var(--red);margin-top:4px;">🩹 ' + r.lesiones + (r.lesiones == 1 ? ' lesión' : ' lesiones') + '</div>' : '');
    infBox.appendChild(div);
  });

  var lesBox = document.getElementById('coachLesionesBox'); lesBox.innerHTML = '';
  var t3 = document.createElement('div'); t3.className = 'exgroup-title'; t3.textContent = '🩹 Lesiones (' + (d.lesiones ? d.lesiones.total : 0) + ')';
  lesBox.appendChild(t3);
  if (d.lesiones && d.lesiones.total) {
    function resumenLinea(titulo, lista) {
      return '<div class="lastmark" style="margin-bottom:4px;">' + titulo + ': ' + lista.map(function (x) { return x.clave + ' (' + x.n + ')'; }).join(' · ') + '</div>';
    }
    var res = document.createElement('div'); res.className = 'rankbox';
    res.innerHTML = resumenLinea('Por zona', d.lesiones.porZona) + resumenLinea('Por ' + (state.coachCamada == 'TODAS' ? 'camada' : 'equipo'), d.lesiones.porEquipo) + resumenLinea('Por momento', d.lesiones.porMomento);
    lesBox.appendChild(res);
    d.lesiones.lista.forEach(function (p) {
      var div = document.createElement('div'); div.className = 'avisocard';
      div.innerHTML = '<div class="meta">' + fmtFecha_(p.fecha) + ' · ' + p.nombre + ' · ' + p.equipo + '</div>' +
        '<div class="texto">' + (p.lesion == 'SEMANA PREVIA' ? '(semana previa) ' : '') + p.zona + (p.detalle ? ' — ' + p.detalle : '') + '</div>';
      lesBox.appendChild(div);
    });
  } else {
    lesBox.innerHTML += '<div class="exempty">Sin lesiones cargadas en esta vista.</div>';
  }
}

// ---------------------------------------------------------------------------
// Render: Avisos
// ---------------------------------------------------------------------------
function fmtFechaHora_(iso) {
  var d = new Date(iso); if (isNaN(d)) return '';
  return d.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit'}) + ' ' + d.toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'});
}

function destinoTexto_(a) {
  if (a.destinoTipo == 'TODOS') return 'A todos';
  if (a.destinoTipo == 'CAMADA') return 'A ' + a.destinoValor;
  if (a.destinoTipo == 'JUGADOR') return 'A ' + a.destinoValor;
  if (a.destinoTipo == 'COACH') return 'Solo vos';
  return '';
}

function renderSolicitudes_() {
  var box = document.getElementById('solicitudesBox');
  var lista = state.solicitudes || [];
  box.classList.toggle('hidden', !state.esCoach || !lista.length);
  if (!state.esCoach || !lista.length) { box.innerHTML = ''; return; }
  box.innerHTML = '';
  var titulo = document.createElement('div'); titulo.className = 'exgroup-title';
  titulo.textContent = 'Solicitudes pendientes (' + lista.length + ')';
  box.appendChild(titulo);
  var msg = document.createElement('div'); msg.id = 'solicitudMsg';
  msg.style.cssText = 'font-family:var(--mono);font-size:12px;margin-bottom:10px;min-height:16px;';
  box.appendChild(msg);
  lista.forEach(function (s) {
    var div = document.createElement('div'); div.className = 'avisocard unread';
    var meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = (s.camada || 'sin camada') + ' · ' + (s.puesto || 'sin puesto');
    var texto = document.createElement('div'); texto.className = 'texto'; texto.textContent = s.nombre + ' — ' + s.email;
    var botones = document.createElement('div'); botones.style.cssText = 'display:flex;gap:8px;margin-top:10px;';
    var ok = document.createElement('button'); ok.textContent = 'Aprobar';
    ok.style.cssText = 'flex:1;background:var(--green);border:none;color:#06222e;font-weight:800;font-family:var(--sans);font-size:13px;padding:9px;border-radius:9px;cursor:pointer;';
    ok.onclick = function () { resolverSolicitud_(s.email, true, s.nombre); };
    var no = document.createElement('button'); no.textContent = 'Rechazar';
    no.style.cssText = 'flex:1;background:var(--panel2);border:1px solid var(--border2);color:var(--text-mid);font-weight:700;font-family:var(--sans);font-size:13px;padding:9px;border-radius:9px;cursor:pointer;';
    no.onclick = function () { resolverSolicitud_(s.email, false, s.nombre); };
    botones.appendChild(ok); botones.appendChild(no);
    div.appendChild(meta); div.appendChild(texto); div.appendChild(botones);
    box.appendChild(div);
  });
}

function resolverSolicitud_(email, aprobar, nombre) {
  if (!configLista_()) return;
  var msg = document.getElementById('solicitudMsg');
  msg.style.color = 'var(--text-dim)'; msg.textContent = (aprobar ? 'Aprobando' : 'Rechazando') + ' a ' + nombre + '…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'resolverSolicitud', email: email, aprobar: aprobar})})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = (aprobar ? '¡Aprobado! ' : 'Rechazado. ') + j.nombre;
      cargarAvisos_();
    })
    .catch(function () { msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

function renderAvisos_() {
  var d = state.avisos; if (!d) return;
  document.getElementById('composeBox').classList.toggle('hidden', !d.esCoach);
  renderSolicitudes_();

  var cb = document.getElementById('cumpleBox'); cb.innerHTML = '';
  (d.cumpleanos || []).forEach(function (c) {
    var div = document.createElement('div'); div.className = 'cumplecard';
    div.innerHTML = '🎂 <b>' + c.nombre + '</b> — ' + (c.hoy ? '¡cumple hoy!' : 'cumple el ' + fmtFecha_(c.fecha));
    cb.appendChild(div);
  });

  var vistos = d.vistosHasta ? new Date(d.vistosHasta).getTime() : 0;
  var list = document.getElementById('avisosList'); list.innerHTML = '';
  if (!d.avisos || !d.avisos.length) { list.innerHTML = '<div class="exempty">Todavía no hay avisos.</div>'; }
  (d.avisos || []).forEach(function (a) {
    var esNuevo = new Date(a.fecha).getTime() > vistos;
    var div = document.createElement('div'); div.className = 'avisocard' + (esNuevo ? ' unread' : '');
    var meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = fmtFechaHora_(a.fecha) + (state.esCoach ? ' · ' + destinoTexto_(a) : '');
    var texto = document.createElement('div'); texto.className = 'texto'; texto.textContent = a.texto;
    div.appendChild(meta); div.appendChild(texto);
    list.appendChild(div);
  });
}

function actualizarBadge_() {
  var badge = document.getElementById('avBadge');
  var d = state.avisos;
  if (!d) { badge.classList.add('hidden'); return; }
  if (state.esCoach) {
    var pendientes = (state.solicitudes || []).length;
    if (pendientes > 0) { badge.textContent = pendientes > 9 ? '9+' : pendientes; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
    return;
  }
  if (!d.avisos) { badge.classList.add('hidden'); return; }
  var vistos = d.vistosHasta ? new Date(d.vistosHasta).getTime() : 0;
  var noLeidos = d.avisos.filter(function (a) { return new Date(a.fecha).getTime() > vistos; }).length;
  if (noLeidos > 0) { badge.textContent = noLeidos > 9 ? '9+' : noLeidos; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

function marcarAvisosVistos_() {
  if (!configLista_() || state.esCoach) return;
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'marcarAvisosVistos'})}).catch(function () {});
}

function normalizarBusqueda_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Sugerencias del buscador de jugador al escribir un aviso a "Un jugador": filtra
// state.jugadoresLista (la manda el backend solo al coach) por coincidencia en cualquier
// parte del nombre, sin importar mayúsculas/tildes.
function renderSugerenciasJugador_(q) {
  var cont = document.getElementById('avJugadorSugerencias');
  var query = normalizarBusqueda_(q).trim();
  if (!query) { cont.classList.add('hidden'); cont.innerHTML = ''; return; }
  var coincidencias = (state.jugadoresLista || [])
    .filter(function (n) { return normalizarBusqueda_(n).indexOf(query) >= 0; })
    .slice(0, 8);
  cont.innerHTML = '';
  if (!coincidencias.length) { cont.classList.add('hidden'); return; }
  coincidencias.forEach(function (n) {
    var div = document.createElement('div'); div.className = 'sug'; div.textContent = n;
    div.onclick = function () {
      document.getElementById('avJugador').value = n;
      cont.classList.add('hidden'); cont.innerHTML = '';
    };
    cont.appendChild(div);
  });
  cont.classList.remove('hidden');
}

function enviarAviso_() {
  var msg = document.getElementById('avMsg');
  var texto = document.getElementById('avTexto').value.trim();
  var destinoTipo = document.getElementById('avDestinoTipo').value;
  var destinoValor = destinoTipo == 'CAMADA' ? document.getElementById('avCamada').value
    : destinoTipo == 'JUGADOR' ? document.getElementById('avJugador').value.trim() : '';
  if (!texto) { msg.style.color = 'var(--red)'; msg.textContent = 'Escribí un mensaje.'; return; }
  if (destinoTipo == 'JUGADOR' && !destinoValor) { msg.style.color = 'var(--red)'; msg.textContent = 'Escribí el nombre del jugador.'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'MODO DEMO: no se envió nada de verdad.'; return; }
  var btn = document.getElementById('avEnviarBtn');
  if (btn.disabled) return;   // evita doble envío por doble tap mientras ya está en curso
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'enviarAviso', destinoTipo: destinoTipo, destinoValor: destinoValor, texto: texto})})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Aviso enviado!';
      document.getElementById('avTexto').value = '';
      cargarAvisos_();
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------
function campoRM_(nombre) {
  var div = document.createElement('div'); div.className = 'exrow2';
  var last = state.misDatos && state.misDatos.ejercicios[nombre];
  var etq = etiquetaCarga_(nombre);
  div.innerHTML =
    '<div class="fitem"><label>' + etq + ' · Kg</label><input type="text" inputmode="decimal" data-ej="' + nombre + '" data-campo="kg"></div>' +
    '<div class="fitem"><label>' + etq + ' · Reps (1 a 15)</label><input type="text" inputmode="numeric" data-ej="' + nombre + '" data-campo="reps"></div>';
  var wrap = document.createElement('div');
  if (last) { var l = document.createElement('div'); l.className = 'lastmark'; l.textContent = 'Última: ' + last.actual + ' kg'; wrap.appendChild(l); }
  wrap.appendChild(div);
  return wrap;
}

function pintarCamposCarga_() {
  EJERCICIOS_POTENCIA_CARGA.concat(EJERCICIOS_FUERZA_CARGA).forEach(function (e) {
    var cont = document.getElementById(CAMPO_ID[e]); if (!cont) return;
    cont.innerHTML = ''; cont.appendChild(campoRM_(e));
  });
  var saltoInfo = state.misDatos && state.misDatos.ejercicios['SALTO HORIZONTAL'];
  document.getElementById('lastSalto').textContent = saltoInfo ? 'Última: ' + saltoInfo.actual + ' m' : '';
  var broncoInfo = state.misDatos && state.misDatos.ejercicios['BRONCO'];
  document.getElementById('lastBronco').textContent = broncoInfo ? 'Última: ' + broncoInfo.actual + ' s' : '';
  var velMaxInfo = state.misDatos && state.misDatos.ejercicios['VEL MAX'];
  document.getElementById('lastVelMax').textContent = velMaxInfo ? 'Última: ' + velMaxInfo.actual + ' km/h' : '';
  var pesoInfo = state.misDatos && state.misDatos.pesoActual;
  document.getElementById('lastPeso').textContent = pesoInfo != null ? 'Último: ' + pesoInfo + ' kg' : '';
  var alturaInfo = state.misDatos && state.misDatos.alturaActual;
  document.getElementById('lastAltura').textContent = alturaInfo != null ? 'Última: ' + alturaInfo + ' cm' : '';
  document.getElementById('cFecha').value = new Date().toISOString().slice(0, 10);
  pintarCamposPartido_();
}

function pintarCamposPartido_() {
  var equipos = (state.misDatos && state.misDatos.equiposPartido) || [];
  var sel = document.getElementById('pEquipo');
  sel.innerHTML = '<option value="">Elegí el equipo</option>' + equipos.map(function (e) { return '<option value="' + e + '">' + e + '</option>'; }).join('');
  var selZona = document.getElementById('pZona');
  if (selZona.options.length <= 1) {
    selZona.innerHTML = '<option value="">Elegí la zona</option>' + ZONAS_LESION.map(function (z) { return '<option value="' + z + '">' + z + '</option>'; }).join('');
  }
  document.getElementById('pFecha').value = new Date().toISOString().slice(0, 10);
  var p = state.misDatos && state.misDatos.partidos;
  document.getElementById('lastPartido').textContent = (p && p.ultimo) ? 'Último: ' + p.ultimo.equipo + ' · ' + p.ultimo.minutos + ' min · ' + fmtFecha_(p.ultimo.fecha) : '';
}

function recolectarEjercicios_() {
  var out = [];
  document.querySelectorAll('[data-ej]').forEach(function (inp) {
    var ej = inp.getAttribute('data-ej'), campo = inp.getAttribute('data-campo');
    if (!inp.value) return;
    var existente = out.filter(function (o) { return o.nombre == ej; })[0];
    if (!existente) { existente = {nombre: ej}; out.push(existente); }
    existente[campo] = inp.value;
  });
  return out.filter(function (o) { return o.reps || o.kg; });
}

function enviarCarga_() {
  var msg = document.getElementById('cargaMsg');
  var ejercicios = recolectarEjercicios_();
  var salto = document.getElementById('cSalto').value;
  if (salto) ejercicios.push({nombre: 'SALTO HORIZONTAL', valor: salto});
  var bronco = document.getElementById('cBronco').value;
  if (bronco) ejercicios.push({nombre: 'BRONCO', valor: bronco});
  var velMax = document.getElementById('cVelMax').value;
  if (velMax) ejercicios.push({nombre: 'VEL MAX', valor: velMax});
  var body = {
    token: state.token, fecha: document.getElementById('cFecha').value,
    pesoCorporal: document.getElementById('cPeso').value, altura: document.getElementById('cAltura').value,
    rpeSesion: document.getElementById('cRpe').value,
    duracionMin: document.getElementById('cMin').value, ejercicios: ejercicios
  };
  if (!ejercicios.length && !body.pesoCorporal && !body.altura) { msg.style.color = 'var(--red)'; msg.textContent = 'Cargá al menos un dato.'; return; }
  var repsInvalidas = ejercicios.filter(function (e) { return e.reps && (Number(e.reps) < 1 || Number(e.reps) > 15); });
  if (repsInvalidas.length) { msg.style.color = 'var(--red)'; msg.textContent = 'Reps fuera de rango en ' + repsInvalidas.map(function (e) { return e.nombre; }).join(', ') + ' (tiene que ser de 1 a 15).'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'MODO DEMO: no se envió nada de verdad (falta configurar el backend).'; return; }
  var btn = document.getElementById('submitBtn');
  if (btn.disabled) return;   // evita doble envío por doble tap mientras ya está en curso
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(body)})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Cargado! (' + j.cargados + ' registros)';
      cargarMisDatos_();
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

function enviarPartido_() {
  var msg = document.getElementById('partidoMsg');
  var lesion = document.getElementById('pLesion').value;
  var body = {
    token: state.token, action: 'partido', fecha: document.getElementById('pFecha').value,
    equipo: document.getElementById('pEquipo').value, minutos: document.getElementById('pMinutos').value,
    lesion: lesion, zona: document.getElementById('pZona').value, detalle: document.getElementById('pDetalle').value
  };
  if (!body.equipo) { msg.style.color = 'var(--red)'; msg.textContent = 'Elegí el equipo.'; return; }
  if (lesion == 'NO' && !body.minutos) { msg.style.color = 'var(--red)'; msg.textContent = 'Cargá los minutos que jugaste.'; return; }
  if (lesion != 'NO' && !body.zona) { msg.style.color = 'var(--red)'; msg.textContent = 'Elegí la zona de la lesión.'; return; }
  if (lesion != 'NO' && !body.detalle.trim()) { msg.style.color = 'var(--red)'; msg.textContent = 'Escribí qué fue la lesión.'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'MODO DEMO: no se envió nada de verdad (falta configurar el backend).'; return; }
  var btn = document.getElementById('partidoBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(body)})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Partido cargado!';
      document.getElementById('pMinutos').value = ''; document.getElementById('pDetalle').value = '';
      document.getElementById('pLesion').value = 'NO';
      document.getElementById('pZonaWrap').classList.add('hidden'); document.getElementById('pDetalleWrap').classList.add('hidden');
      cargarMisDatos_();
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

// ---------------------------------------------------------------------------
// Navegación entre pantallas
// ---------------------------------------------------------------------------
function irAPantalla_(nombre) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-screen') == nombre); });
  document.getElementById('screen' + nombre).classList.add('active');
  if (nombre == 'Ranking') {
    document.getElementById('coachPartidosBox').classList.toggle('hidden', !state.esCoach);
    document.getElementById('miRankingBox').classList.toggle('hidden', state.esCoach && !state.misDatos);
    if (state.esCoach) cargarRankingCoach_();
    if (state.misDatos && !state.ranking) cargarRanking_();
  }
  if (nombre == 'Carga') pintarCamposCarga_();
  if (nombre == 'Avisos') { cargarAvisos_(); marcarAvisosVistos_(); document.getElementById('avBadge').classList.add('hidden'); }
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { irAPantalla_(t.getAttribute('data-screen')); }; });
  document.getElementById('logoutBtn').onclick = salir_;
  document.getElementById('demoBtn').onclick = function () { state.token = 'demo'; entrarAlApp_(); };
  document.getElementById('submitBtn').onclick = enviarCarga_;
  document.getElementById('cRpe').oninput = function (e) { document.getElementById('rpeVal').textContent = e.target.value; };
  document.getElementById('avEnviarBtn').onclick = enviarAviso_;
  document.getElementById('avDestinoTipo').onchange = function (e) {
    document.getElementById('avCamadaWrap').classList.toggle('hidden', e.target.value != 'CAMADA');
    document.getElementById('avJugadorWrap').classList.toggle('hidden', e.target.value != 'JUGADOR');
    document.getElementById('avJugadorSugerencias').classList.add('hidden');
  };
  document.getElementById('avJugador').oninput = function (e) { renderSugerenciasJugador_(e.target.value); };
  document.getElementById('avJugador').addEventListener('blur', function () {
    setTimeout(function () { document.getElementById('avJugadorSugerencias').classList.add('hidden'); }, 150);
  });
  document.getElementById('coachCamada').onchange = function (e) { state.coachCamada = e.target.value; cargarRankingCoach_(); };
  document.getElementById('partidoBtn').onclick = enviarPartido_;
  document.getElementById('pLesion').onchange = function (e) {
    var hayLesion = e.target.value != 'NO';
    document.getElementById('pZonaWrap').classList.toggle('hidden', !hayLesion);
    document.getElementById('pDetalleWrap').classList.toggle('hidden', !hayLesion);
  };

  var token = null;
  try { token = localStorage.getItem('liceo_token'); } catch (e) {}
  if (token) { state.token = token; entrarAlApp_(); } else { iniciarGoogle(); }

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(function () {});
});
