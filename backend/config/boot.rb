ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)
require "bundler/setup"
# Prefer prism gem over stdlib (stdlib can be broken on some Ruby/snap builds)
prism_spec = Gem::Specification.find_by_name("prism") rescue nil
if prism_spec
  prism_lib = File.join(prism_spec.full_gem_path, "lib")
  $LOAD_PATH.unshift(prism_lib) unless $LOAD_PATH.first == prism_lib
end
