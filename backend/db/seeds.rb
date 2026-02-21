# frozen_string_literal: true

User.find_or_create_by!(id: 1) do |u|
  u.name = "Demo User"
  u.points_balance = 500
end

[
  [1, "Free Coffee", 100, "Any size coffee on us"],
  [2, "Free Pastry", 150, "One pastry of your choice"],
  [3, "$5 Off", 250, "$5 off your next order of $15+"],
  [4, "Free Entrée", 400, "Free entrée up to $12"]
].each do |id, name, points_cost, description|
  Reward.find_or_create_by!(id: id) do |r|
    r.name = name
    r.points_cost = points_cost
    r.description = description
  end
end
