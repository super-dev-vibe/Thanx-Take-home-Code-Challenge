# frozen_string_literal: true

class StaticController < ActionController::API
  STATIC_ROOT = Rails.root.join("..", "frontend", "dist").expand_path.freeze
  MIME_TYPES = {
    ".html" => "text/html",
    ".js" => "application/javascript",
    ".css" => "text/css",
    ".ico" => "image/x-icon",
    ".svg" => "image/svg+xml",
    ".png" => "image/png",
    ".jpg" => "image/jpeg",
    ".jpeg" => "image/jpeg",
    ".woff" => "font/woff",
    ".woff2" => "font/woff2"
  }.freeze

  def index
    raw_path = request.path.sub(/\A\/+/, "")
    safe = (raw_path.presence || "index.html").split("/").reject { |x| x == ".." }.join("/")
    safe = "index.html" if safe.blank?
    full = STATIC_ROOT.join(safe)
    full = Pathname.new(File.expand_path(full.to_s))
    root_s = File.expand_path(STATIC_ROOT.to_s)
    return head :not_found unless full.to_s.start_with?(root_s + "/") || full.to_s == root_s

    if File.file?(full)
      mime = MIME_TYPES[File.extname(full)] || "application/octet-stream"
      send_data File.binread(full), type: mime, disposition: "inline"
    else
      index_path = STATIC_ROOT.join("index.html")
      return head :not_found unless File.file?(index_path)
      send_data File.read(index_path), type: "text/html", disposition: "inline"
    end
  end
end
