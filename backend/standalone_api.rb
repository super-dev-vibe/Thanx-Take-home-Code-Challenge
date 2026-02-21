#!/usr/bin/env ruby
require "json"
require "sqlite3"
require "socket"

DB = File.expand_path("db/development.sqlite3", __dir__)

def db
  @db ||= begin
    d = SQLite3::Database.new(DB)
    d.results_as_hash = true
    d
  end
end

def read_request(sock)
  line = sock.gets
  return nil unless line
  method, path, _ = line.strip.split(" ", 3)
  path = (path || "").split("?").first.to_s.gsub(%r{/+$}, "")
  headers = {}
  while (h = sock.gets) && h != "\r\n"
    k, v = h.strip.split(": ", 2)
    headers[k.to_s.downcase] = v
  end
  len = headers["content-length"].to_i
  body = len.positive? ? sock.read(len) : nil
  [method.to_s.upcase, path, body]
end

def reply(sock, status, json)
  body = json.is_a?(String) ? json : JSON.generate(json)
  sock.write("HTTP/1.1 #{status}\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: #{body.bytesize}\r\n\r\n#{body}")
end

def err(msg)
  { errors: [msg].flatten }
end

def parse_body(body)
  return {} if body.to_s.strip.empty?
  JSON.parse(body)
rescue JSON::ParserError
  {}
end

def route(method, path, body)
  if method == "GET" && path =~ %r{\A/api/users/(\d+)/points\z}
    uid = $1.to_i
    row = db.execute("SELECT id, points_balance FROM users WHERE id = ?", uid).first
    return [404, err("Not found")] unless row
    return [200, { user_id: row["id"], points_balance: row["points_balance"] }]
  end

  if method == "POST" && (path =~ %r{\A/api/users/(\d+)/points\z} || path =~ %r{\A/users/(\d+)/points\z})
    uid = $1.to_i
    data = parse_body(body)
    pts = data["points"]
    add = pts.is_a?(Numeric) ? pts.to_i : pts.to_s.to_i
    return [400, err("Missing or invalid points")] unless add.positive?
    row = db.execute("SELECT id, points_balance FROM users WHERE id = ?", uid).first
    return [404, err("User not found")] unless row
    bal = row["points_balance"].to_i
    now = Time.now.utc.iso8601(3)
    db.execute("UPDATE users SET points_balance = ?, updated_at = ? WHERE id = ?", [bal + add, now, uid])
    return [200, { user_id: uid, points_balance: bal + add, added: add }]
  end

  if method == "POST" && path == "/api/topup"
    data = parse_body(body)
    uid = data["user_id"].to_s.to_i
    pts = data["points"]
    add = pts.is_a?(Numeric) ? pts.to_i : pts.to_s.to_i
    return [400, err("Missing user_id or points")] if uid.zero? || !add.positive?
    row = db.execute("SELECT id, points_balance FROM users WHERE id = ?", uid).first
    return [404, err("User not found")] unless row
    bal = row["points_balance"].to_i
    now = Time.now.utc.iso8601(3)
    db.execute("UPDATE users SET points_balance = ?, updated_at = ? WHERE id = ?", [bal + add, now, uid])
    new_bal = bal + add
    puts "[topup] user_id=#{uid} added=#{add} balance=#{bal}->#{new_bal} at #{now}"
    return [200, { user_id: uid, points_balance: new_bal, added: add }]
  end

  if method == "GET" && path == "/api/rewards"
    rows = db.execute("SELECT id, name, points_cost, description FROM rewards ORDER BY points_cost")
    return [200, rows.map { |r| { id: r["id"], name: r["name"], points_cost: r["points_cost"], description: r["description"] } }]
  end

  if method == "GET" && path =~ %r{\A/api/users/(\d+)/redemptions\z}
    uid = $1.to_i
    rows = db.execute("SELECT r.id, r.reward_id, r.redeemed_at, w.name AS reward_name, w.points_cost FROM redemptions r JOIN rewards w ON r.reward_id = w.id WHERE r.user_id = ? ORDER BY r.redeemed_at DESC", uid)
    return [200, rows.map { |r| { id: r["id"], reward_id: r["reward_id"], reward_name: r["reward_name"], points_cost: r["points_cost"], redeemed_at: r["redeemed_at"] } }]
  end

  if method == "POST" && path =~ %r{\A/api/users/(\d+)/redemptions\z}
    uid = $1.to_i
    data = parse_body(body)
    rid = data.dig("redemption", "reward_id")&.to_i
    return [400, err("Missing reward_id")] unless rid && rid.positive?
    user = db.execute("SELECT id, points_balance FROM users WHERE id = ?", uid).first
    return [404, err("Not found")] unless user
    reward = db.execute("SELECT id, name, points_cost FROM rewards WHERE id = ?", rid).first
    return [404, err("Not found")] unless reward
    bal = user["points_balance"].to_i
    cost = reward["points_cost"].to_i
    return [422, err("Insufficient points")] if bal < cost
    now = Time.now.utc.iso8601(3)
    db.execute("INSERT INTO redemptions (user_id, reward_id, redeemed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [uid, rid, now, now, now])
    db.execute("UPDATE users SET points_balance = ?, updated_at = ? WHERE id = ?", [bal - cost, now, uid])
    return [201, { id: db.last_insert_row_id, reward_name: reward["name"], points_cost: cost, redeemed_at: now, new_balance: bal - cost }]
  end

  return [204, ""] if method == "OPTIONS"
  [404, err("Not found")]
end

def status_line(code)
  { 200 => "200 OK", 201 => "201 Created", 204 => "204 No Content", 400 => "400 Bad Request", 404 => "404 Not Found", 422 => "422 Unprocessable Entity" }[code] || "500 Internal Server Error"
end

server = TCPServer.new("0.0.0.0", 3000)
puts "API http://0.0.0.0:3000"
loop do
  sock = server.accept
  begin
    req = read_request(sock)
    next unless req
    method, path, body = req
    code, payload = route(method, path, body)
    if code == 204
      sock.write("HTTP/1.1 204 No Content\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\n\r\n")
    else
      reply(sock, status_line(code), payload)
    end
  ensure
    sock.close
  end
end
