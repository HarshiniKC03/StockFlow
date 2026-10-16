package com.stockflow.service;

import com.stockflow.dto.UserCreateRequest;
import com.stockflow.dto.UserResponse;
import com.stockflow.entity.Role;
import com.stockflow.entity.User;
import com.stockflow.entity.enums.RoleName;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.RoleRepository;
import com.stockflow.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already taken");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email '" + email + "' is already registered");
        }

        User user = new User(
            username,
            email,
            passwordEncoder.encode(request.getPassword()),
            request.getFullName().trim()
        );

        Set<Role> roles = new HashSet<>();
        for (String roleStr : request.getRoles()) {
            RoleName roleName;
            try {
                roleName = RoleName.valueOf(roleStr.toUpperCase().startsWith("ROLE_") ? roleStr.toUpperCase() : "ROLE_" + roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                roleName = RoleName.ROLE_SALES_EMPLOYEE;
            }
            Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_SALES_EMPLOYEE)));
            roles.add(role);
        }

        user.setRoles(roles);
        User saved = userRepository.save(user);

        auditLogService.logAction("CREATE_USER", "User", saved.getId(),
            null, saved.getUsername(), "Administrator created user account with roles " + request.getRoles());

        return mapToResponse(saved);
    }

    @Transactional
    public void toggleUserActive(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        boolean prev = user.isActive();
        user.setActive(!prev);
        userRepository.save(user);

        auditLogService.logAction("TOGGLE_USER_ACTIVE", "User", user.getId(),
            String.valueOf(prev), String.valueOf(!prev), "Changed user active status to " + !prev);
    }

    public UserResponse mapToResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
            .map(r -> r.getName().name())
            .collect(Collectors.toSet());

        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.isActive(),
            roleNames,
            user.getCreatedAt()
        );
    }
}
